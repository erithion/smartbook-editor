import React from 'react';
import Draft from 'draft-js';
import Imm from 'immutable';
import 'draft-js/dist/Draft.css';

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
//        console.log(Draft);
        const books = { first : this.props.bookFirst ? this.props.bookFirst : ''
                      , second: this.props.bookSecond ? this.props.bookSecond : '' 
                      };
        const initialBlocks = this.insertFront(books);
        this.state = {
            editorState: Draft.EditorState.createWithContent(Draft.ContentState.createFromBlockArray(initialBlocks))
        };
    }

    onChange = (editorState) => {
        return this.setState({ editorState });
    }

    makeContentBlock = (blockText, bookType) => new Draft.ContentBlock({
        key: Draft.genKey(),
        type: 'unstyled',
        text: blockText,
        data: { book: bookType }
    });

    // The resulting SelectionState must be applied to editorState to take effect.
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
            const text = (bookText + textFromBlocks)
                         .trim()
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

    /* Deletion always happens backwards 
        
    */
    deleteText = (state, blockFrom, offsetFrom, length) => {
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
        const newFocusOffset = prevBlocks[prevBlocks.length - 1].text.length - offsetFromEnd;
        
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

    handlePastedText = (text: string, html?: string, editorState: EditorState) => {
        const selection = editorState.getSelection();
        const currentKey = selection.focusKey;
        const currentOffset = selection.focusOffset;
        const currentBlock = editorState.getCurrentContent().getBlockForKey(currentKey);
        const marker = create_UUID();
        const newText = [currentBlock.text.slice(0, currentOffset), text, marker, currentBlock.text.slice(currentOffset), "\n"].join('');

        const blocks = editorState.getCurrentContent().getBlockMap();
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

        // Applying the changes
        this.onChange(newEditorState);

        return 'handled';
    }

    handleKeyCommand = (command: string, editorState) => {
        if (command === 'backspace') {
            const selection = editorState.getSelection();
            const offset = selection.focusOffset;
            const block = editorState.getCurrentContent().getBlockForKey(selection.focusKey);
            // TODO: make sure delete on the last row deletes it
            const val = this.deleteText(editorState, block, offset, 1);
            
            const newState = Draft.EditorState.forceSelection(
                Draft.EditorState.createWithContent(val.newBlocks),
                this.moveCursor(val.newKey, val.newOffset));
            // Applying the changes
            this.onChange(newState);
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
                blockRendererFn={smartbookEditorRendererFn}
                handleKeyCommand={this.handleKeyCommand}
                handlePastedText={this.handlePastedText}
            />
        );
    }
}
export default SmartbookEditor
