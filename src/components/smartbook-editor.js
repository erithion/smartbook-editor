import React from 'react';
import Draft from 'draft-js';
import Imm from 'immutable';
import 'draft-js/dist/Draft.css';
import KeyCode from 'keycode-js';

import {smartbookEditorRendererFn} from './smartbook-block';
import type {SmartbookEditorProps} from 'smartbook-props';

// Utility to mark an end of inserted text while inserting
function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c==='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

class SmartbookEditor extends React.Component<SmartbookEditorProps> {
    
    constructor(props: SmartbookEditorProps) {
        super(props);
        const books = { first : this.props.bookFirst ? this.props.bookFirst : ''
                      , second: this.props.bookSecond ? this.props.bookSecond : '' 
                      };
        const initialBlocks = this.insertFront(books);
        this.state = {
            editorState: Draft.EditorState.createWithContent(Draft.ContentState.createFromBlockArray(initialBlocks))
        };
        this.onChange = (editorState) => this.setState({editorState});
    }
    
    makeContentBlock = (blockText, bookType) => new Draft.ContentBlock({
        key: Draft.genKey(),
        type: 'unstyled',
        text: blockText,
        data: { book: bookType }
    })
    moveCursor = (key, offset) => 
        new Draft.SelectionState({
                anchorKey: key,
                anchorOffset: offset,
                focusKey: key,
                focusOffset: offset,
                isBackward: false,
        })
    insertFront = (books : {key1 : text1, ... }, blocks = []) => {
        // Inserting to front
        const texts = Imm.Map(books).map((bookText, bookType) => {
            // To text
            const textFromBlocks = blocks.filter(block => block.data.book === bookType)
                                         .reduce((accum, data) => accum + data.text + "\n", "");
            // To rows
            const text = (bookText + textFromBlocks.trim())
//                         .trim()  // bookText must not be trimmed. otherwise inserting "/n" becomes impossible
                         .replace(/\\r\\n|\\r|\\n/g,'\n') // in case the text came from hardcoded js string
                         .split(/\r?\n/);
            return Imm.List(text); 
                
        }); // [ { "bookType 1" : ["book 1 row 1", "book 1 row 2", ...]}, ..., {"bookType N" : ["book N row 1, "book N row 2, ..."]} ]
        // Max rows of all
        const max = texts.map(bookText => bookText.length).toArray()
                         .reduce((accum, val) => Math.max(accum, val), 0);
        // Content blocks
        const contentBlocks = texts.map((bookText, bookType) =>
            // Padding
            bookText.concat(Imm.Repeat(null, max - bookText.count()))
                    .map(v => this.makeContentBlock(v ? v : '', bookType))
        ).toList();
        // Zipping
        return contentBlocks.get(0)
                            .zip(...contentBlocks.rest()).toArray()
                            .reduce((accum, data) => accum.concat(data), []);
    }
    deleteText = (blocks, blockFrom, offsetFrom, length) => {
        const bookType = blockFrom.data.book;
        
        // Splitting
        const thisBook = blocks.toSeq()
            .filter(block => block.data.book === bookType);
        const otherBooks = blocks.toSeq()
            .map(el => el.data.book === bookType ? null : el).toArray();
        
        // Deleting
        const prevLength = thisBook
            .takeUntil(block => block === blockFrom)
            .reduce((accum, data) => accum + data.text + "\n", "")
            .length;
        const bookText = thisBook
            .reduce((accum, data) => accum + data.text + "\n", "");
        const textLines = ( bookText.substring(0, prevLength + offsetFrom) // CAREFUL: substring(0, -1) has been tested in Opera only;
                                                                           // Case happens with backspace on 0 position of the very first book row 
                          + bookText.substring(prevLength + offsetFrom + length))
            .trimEnd()
            .split("\n");
        
        // Building back
        const newBlocks = Imm.List(textLines).map(txt => this.makeContentBlock(txt, bookType)).toArray();  
        var   idx = 0; // with closure it looks way more legible than with reduce
        const arr = otherBooks.map(el => 
            el !== null ? el :
                idx < newBlocks.length ? newBlocks[idx++] : this.makeContentBlock('', bookType)
        );
        
        return arr;        
    }

    deleteTextOld = (state, blockFrom, offsetFrom, length) => { // Deletes length characters backwards starting from offsetFrom
        const blocks = state.getCurrentContent().getBlockMap();
        const bookType = blockFrom.data.book;
        
        // Splitting
        const thisBook = blocks.toSeq()
            .filter(block => block.data.book === bookType);
        const otherBooks = blocks.toSeq()
            .map(el => el.data.book === bookType ? null : el).toArray();
        
        // Deleting
        const prevText = thisBook
            .takeUntil(block => block === blockFrom)
            .reduce((accum, data) => accum + data.text + "\n", "") + blockFrom.text;
        const offsetFromEnd = blockFrom.text.length - offsetFrom;
        const textLines = ( prevText.substring(0, prevText.length - offsetFromEnd - length)
                          + blockFrom.text.substring(offsetFrom))
            .split("\n");
        
        // New borders
        const prevBlocks = Imm.List(textLines).map(txt => this.makeContentBlock(txt, bookType)).toArray();  
        const newFocusKey = prevBlocks[prevBlocks.length - 1].key;
        const newFocusOffset = prevBlocks[prevBlocks.length - 1].text.length 
                    - (offsetFromEnd === -1 ? 0 : offsetFromEnd); // ad-hoc for delete operation 
        
        // Building back
        const newBlocks = prevBlocks.concat(thisBook.skipUntil(block => block === blockFrom).rest().toArray());
        var   idx = 0; // with closure it looks way more legible than with reduce
        const arr = otherBooks.map(el => 
            el !== null ? el :
                idx < newBlocks.length ? newBlocks[idx++] : this.makeContentBlock('', bookType)
        );
        
        return { newBlocks: Draft.ContentState.createFromBlockArray(arr)
               , newKey: newFocusKey
               , newOffset: newFocusOffset
        };        
    }

    _mapKeyToEditorCommand(e) {
        if (parseInt(e.key) === KeyCode.KEY_DOWN) 
            return 'test/nextblock';
        else if (parseInt(e.key) === KeyCode.KEY_ENTER) 
            return 'test/hitenter';
        else if (parseInt(e.key) === KeyCode.KEY_RIGHT) 
            return 'test/moveright';
        else if (parseInt(e.key) === KeyCode.KEY_BACK_SPACE)
            return 'test/hitbackspace';
        else if (parseInt(e.key) === KeyCode.KEY_DELETE)
            return 'test/hitdelete';
        return Draft.getDefaultKeyBinding(e);
    }

    _onBackspace = (state) => {
        const selection = state.editorState.getSelection();
        var   offset = selection.focusOffset - 1;
        var   key = selection.focusKey;
        if (offset === -1) {
            const prevKey = state.editorState.getCurrentContent().getKeyBefore(key);
            const block = state.editorState.getCurrentContent().getBlockBefore(prevKey);
            if (block === undefined)
                return state; // first row - nothing to delete
            key = block.key;
            offset = block.text.length;
        }
        const newEditorState = Draft.EditorState.forceSelection( state.editorState
                                                               , this.moveCursor(key, offset) );
        return this._onDelete({editorState: newEditorState});
    }

    _onDelete = (state) => {
        const selection = state.editorState.getSelection();
        const offset = selection.focusOffset;
        const block = state.editorState.getCurrentContent().getBlockForKey(selection.focusKey);
        const blocks = state.editorState.getCurrentContent().getBlockMap();
        
        const marker = create_UUID();
        const textWithMarker = [block.text.slice(0, offset), marker, block.text.slice(offset)].join('');
        const blocksWithMarker = blocks.setIn([selection.focusKey, 'text'], textWithMarker);
        const newBlocks = this.deleteText(blocksWithMarker, blocksWithMarker.get(selection.focusKey), offset + marker.length, 1);

        const newBlockMarked = newBlocks.find(block => block.text.includes(marker));
        const strings = newBlockMarked.text.split(marker); // 0th string's end is where new position should be
        const newContentState = Draft.ContentState.createFromBlockArray(newBlocks)
                                                  // Setting new text
                                                  .setIn(['blockMap', newBlockMarked.key, 'text'], strings.join(''));

        const newEditorState = Draft.EditorState.forceSelection( Draft.EditorState.createWithContent(newContentState)
                                                               , this.moveCursor(newBlockMarked.key, strings[0].length) );

        // NOTE: doesn't support selection deletion yet since doesn't try to reposition the cursor
        return {editorState: newEditorState};
    }
    
    _onNextBlock = (state) => {
        const selection = state.editorState.getSelection();
        const offset = selection.focusOffset;
        const key = state.editorState.getCurrentContent().getKeyAfter(selection.focusKey);
        
        const newState = Draft.EditorState.forceSelection(
            state.editorState,
            this.moveCursor(key, offset));
        return {editorState: newState};
    }
    
    _onMoveRight = (state) => {
        const selection = state.editorState.getSelection();
        const offset = selection.focusOffset;
        
        const newState = Draft.EditorState.forceSelection(
            state.editorState,
            this.moveCursor(selection.focusKey, offset + 1));
        return {editorState: newState};
    }
    
    _onPaste = (state, text) => {
        const selection = state.editorState.getSelection();
        const currentKey = selection.focusKey;
        const currentOffset = selection.focusOffset;
        const currentBlock = state.editorState.getCurrentContent().getBlockForKey(currentKey);
        const marker = create_UUID();
        const newText = [currentBlock.text.slice(0, currentOffset), text, marker, currentBlock.text.slice(currentOffset), "\n"].join('');

        const blocks = state.editorState.getCurrentContent().getBlockMap();
        const blocksBefore = blocks.toSeq().takeUntil(block => block === currentBlock).toArray();
        const blocksAfter = blocks.toSeq().skipUntil(block => block === currentBlock).rest().toArray();

        var newBlocks = null;
        if (currentBlock.data.book === 'second') {
            const prevBlockText = Imm.Seq(blocksBefore).last().text + '\n';
            const books = { first : prevBlockText, second: newText };
            newBlocks = Imm.Seq(blocksBefore).butLast().toArray() // skip one block above
                              .concat(this.insertFront(books, blocksAfter));
        } else {
            const books = { first : newText, second: '' };
            newBlocks = blocksBefore.concat(this.insertFront(books, blocksAfter));
        }
        const markedBlock = newBlocks.find(block => block.text.includes(marker));
        const strings = markedBlock.text.split(marker); // first elem is a last string of the inserted text
        const newContentState = Draft.ContentState.createFromBlockArray(newBlocks)
                                                  // Setting new text
                                                  .setIn(['blockMap', markedBlock.key, 'text'], strings.join(''));
            
        const newEditorState = Draft.EditorState.forceSelection( Draft.EditorState.createWithContent(newContentState)
                                                               , this.moveCursor(markedBlock.key, strings[0].length) );

        return {editorState: newEditorState};
    }
    
    handlePastedText = (text: string) => {
        this.setState(state => this._onPaste(state, text));
        return 'handled';
    }

    handleKeyCommand = (command: string) => {
        if (command === 'backspace') {
            this.setState(state => this._onBackspace(state));
            return 'handled';
        } else if (command === 'delete') {
            this.setState(state => this._onDelete(state));
            return 'handled';
        } else if (command === 'test/nextblock') { // For testing purposes chiefly
            this.setState(state => this._onNextBlock(state));
            return 'handled';
        } else if (command === 'test/hitenter') { // For testing purposes chiefly
            return this.handlePastedText('\n');
        } else if (command === 'test/hitbackspace') { // For testing purposes chiefly
            this.setState(state => this._onBackspace(state));
            return 'handled';
        } else if (command === 'test/hitdelete') { // For testing purposes chiefly
            this.setState(state => this._onDelete(state));
            return 'handled';
        } else if (command === 'test/moveright') { // For testing purposes chiefly
            this.setState(state => this._onMoveRight(state));
            return 'handled';
        }
        return 'not-handled';
    }

    render() {
        return (
            <Draft.Editor
                editorState={this.state.editorState}
                onChange={this.onChange}
                handleReturn={this.handlePastedText.bind(this, '\n')}
                keyBindingFn={this._mapKeyToEditorCommand.bind(this)}
                blockRendererFn={smartbookEditorRendererFn}
                handleKeyCommand={this.handleKeyCommand}
                handlePastedText={this.handlePastedText}
            />
        );
    }
}
export default SmartbookEditor
