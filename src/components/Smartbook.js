import React from 'react';
import Draft from 'draft-js';
import Imm from 'immutable';
import {Smartblock, smartRenderer} from './block';

class Smartbook extends React.Component {
    constructor(props) {
        super(props);
        const initialBlocks = [this.makeContentBlock("", 'first')];
        this.state = {
            editorState: Draft.EditorState.createWithContent(Draft.ContentState.createFromBlockArray(initialBlocks))
        };
   }

    onChange = (editorState) => {
        this.setState({
            editorState
        })
    }

    makeContentBlock = (blockText, bookType) => new Draft.ContentBlock({
        key: Draft.genKey(),
        type: 'unstyled',
        text: blockText,
        data: { book: bookType }
    });

    zipTexts = (texts: [string]) : [[string]] => {
        const splits = texts.map(el => 
            Imm.List(el ? el.split("\n") : []));
        const max = splits.reduce((accum, data) => 
            Math.max(accum, data.count()), 0);
        const aligns = splits.map(el => 
            el.concat( Imm.Repeat(null, max - el.count()) ));
        return Imm.List(aligns).get(0).zip(...Imm.List(aligns).rest()).toArray();
    }

    toContentBlocks = (zipped, order) => {
        return zipped.map(block => 
                Imm.List(block).zipWith((el, type) => this.makeContentBlock(el ? el : '', type), order).toArray() )
            // This is really dumb. It is basically foldl here.
            // Why not to follow Haskell's 'join' (or 'concat' for the lists) laws to flatten out the inner list?!!!
            . reduce((accum, data) => {
                return accum.concat(data);
            }, []);
    }
    
    getCurrent = (state) => {
        const content = state.getCurrentContent();
        const selection = state.getSelection();
        const key = selection.focusKey;
        const offset = selection.focusOffset;
        const block = content.getBlockForKey(key);
        const type = block.data.book;
        return {key: key, offset: offset, block: block, type: type};
    }
    
    /*  The resulting ContentBlocks map must be applied to editorState to take effect.
        Inserts the text into blockInto ContentBlock at offsetInto offset. 
        The type of the book is determined by the first element of the order list
            order - the list. 
                    Example: ['first', 'second', 'third'] - the function will mark the inserted blocks with the book text as 'first';
                             and will add an array of 'second' and 'third' ContentBlocks of size of the inserted text in 'first'
    */
    insertText = (state, blockInto, offsetInto, order, text) => {
        const blocks = state.getCurrentContent().getBlockMap();
        const blocksBefore = blocks.toSeq().takeUntil(block => block === blockInto).toArray();
        const blocksAfter = blocks.toSeq().skipUntil(block => block === blockInto).toArray();
        
        const texts = order.map(bookType =>
            blocksAfter.filter(block => block.data.book === bookType)
                       .reduce((accum, data) => accum + data.text + "\n", "")
                       .slice(0, -1) // removing last \n
        );
        // [ "book 1 text ...", "book 2 text ...", ..., "book N text ..." ]
        
        const joined = Imm.List(texts).set(0, texts[0].substring(0, offsetInto) 
                                            + text 
                                            + texts[0].substring(offsetInto)).toArray();

        const zipped = this.zipTexts(joined);
        const newBlocks = this.toContentBlocks(zipped, order);

        const blocksMap = Draft.ContentState.createFromBlockArray(blocksBefore.concat(newBlocks));

        // Calculating the insertion borders
        const temp = text.split("\n");
        const startIndex = blocksBefore.length;
        const endIndex = blocksBefore.length + (temp.length * order.length - 1) - 1;
        const endOffset = temp[temp.length - 1].length;

        return { blocks: blocksMap
               , startIndex: startIndex, startOffset: offsetInto
               , endIndex: endIndex, endOffset: endOffset};
    }

    /* Deletion always happens backwards 
        
    */
    deleteText = (state, blockFrom, offsetFrom, length) => {
        const blocks = state.getCurrentContent().getBlockMap();
        const bookType = blockFrom.data.book;
        
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
        var   idx = 0; // with closure it is simpler than with reduce
        const arr = otherBooks.map(el => {
            if (el !== null) 
                return el;
            else if (idx < newBlocks.length)
                return newBlocks[idx++];
            else 
                return this.makeContentBlock('', bookType);
        });
        
        return { blocks: Draft.ContentState.createFromBlockArray(arr)
               , key: newFocusKey
               , offset: newFocusOffset
        };        
    }

    // The resulting SelectionState must be applied to editorState to take effect.
    moveCursor = (key, offset) => 
        new Draft.SelectionState({
                anchorKey: key,
                anchorOffset: offset,
                focusKey: key,
                focusOffset: offset,
                isBackward: false,
        })
    
    handlePastedText = (text: string, html?: string, editorState: EditorState): DraftHandleValue => {
        const {key, offset, block, type} = this.getCurrent(editorState);
        const order = type === 'second' 
            // The cursor is on the second book
            ? ['second', 'first'] 
            : ['first', 'second'];
        
        const val = this.insertText(editorState, block, offset, order, text);
        const newState = Draft.EditorState.forceSelection(
            Draft.EditorState.createWithContent(val.blocks),
            this.moveCursor(val.blocks.getBlocksAsArray()[val.endIndex].key, val.endOffset));

        // Applying the changes
        this.onChange(newState);
        return 'handled';
    }

    handleKeyCommand = (command: string, editorState) => {
        if (command === 'backspace') {
            const {key, offset, block, type} = this.getCurrent(editorState);
            const val = this.deleteText(editorState, block, offset, 1);
            
            const newState = Draft.EditorState.forceSelection(
                Draft.EditorState.createWithContent(val.blocks),
                this.moveCursor(val.key, val.offset));
            // Applying the changes
            this.onChange(newState);
            return 'handled';
        }
        return 'not-handled';
    }

    render() {
        return (
            <div>
            <Draft.Editor
                editorState={this.state.editorState}
                onChange={this.onChange}
                handleReturn={this.handlePastedText.bind(this, '\n')}
                blockRendererFn={smartRenderer}
                handleKeyCommand={this.handleKeyCommand}
                handlePastedText={this.handlePastedText}
            />

                    <input
                    onClick={
() => {

        var first = "123\n4567\n890";
        var second = "abc\ndef\nghi\njkl\nmno";
        var   ls = Imm.List(first ? first.split("\n") : []);
        var   rs = Imm.List(second ? second.split("\n") : []);
        const max = Math.max(ls.count(), rs.count());

              ls = ls.concat( Imm.Repeat(null, max - ls.count()) );
              rs = rs.concat( Imm.Repeat(null, max - rs.count()) );

        const zipped = ls.zip(rs);
        const blocks = this.toContentBlocks(zipped, ['first', 'second']);
//        console.log(blocks);
        

        const { editorState } = this.state;
        var   selectionState = editorState.getSelection();
        const content = editorState.getCurrentContent();
        var   currentKey = selectionState.getFocusKey();
        var   nextKey = content.getKeyAfter(currentKey);
        var   newFocusSelection = Draft.SelectionState.createEmpty(nextKey);
        const newState = Draft.EditorState.createWithContent(Draft.ContentState.createFromBlockArray(blocks));

            // Applying the changes
            this.onChange(newState);
        
    }                        
                    }
/*                onClick={this.addFirst.bind(this, 
                `HOLMES, som vanligvis var meget sent oppe om morgenen, untatt i de ikke sjeldne tilfellene da han var oppe hele natten — satt ved frokostbordet.

Jeg stod på kaminteppet og tok opp stokken som vår gjest den foregående aften hadde etterlatt seg. Den var forarbeidet av vakkert, fast tre, og hadde et løkformet hode. Like under håndtaket gikk et nesten tommebredt sølvbånd.

Til doktor James Mortimer fra hans venner i C. C. H. var inngravert på båndet sammen med årstallet 1884.

Det var nettopp en slik stokk som eldre husleger pleier å ha med seg — respektabel, solid og anselig.

“Nå, Watson, hva får De ut av den?”

Holmes satt med ryggen til meg, og jeg hadde ikke gitt ham noe slags vink om hva jeg holdt på med.

“Hvordan kunne De vite hva jeg tok meg til? Jeg tror De har øyne i nakken.”

“Jeg har i alle fall vår blankpussede sølvkaffekanne foran meg,” sa han. “Men, si meg, Watson, hva får De ut av stokken? Siden vi har vært så uheldige at eiermannen er blitt borte for oss, og vi ikke vet noe om hans ærende, får dette tilfeldige etterlatenskap betydning. La meg høre hvordan De ser for Dem mannen etter å ha undersøkt hans stokk.”

“Jeg tror,” sa jeg, i det jeg fulgte så godt jeg kunne min venns fremgangsmåte, “at Doktor Mortimer er en meget populær eldre lege, velansett, siden de som kjente ham ga ham dette tegn på sin respekt.”

“Godt!” sa Holmes. “Utmerket!”`  //"text\nof\nthe\nfirst\nbook\nthank\nyou\nvery\nmuch"
                )}
*/                
                type="button"
                value="Add first"
              />
                    <input
                onClick={this.handlePastedText.bind(this, 
                `Mr. Sherlock Holmes, who was usually very late in the mornings, save upon those not infrequent occasions when he was up all night, was seated at the breakfast table. I stood upon the hearth-rug and picked up the stick which our visitor had left behind him the night before. It was a fine, thick piece of wood, bulbous-headed, of the sort which is known as a "Penang lawyer." Just under the head was a broad silver band nearly an inch across. "To James Mortimer, M.R.C.S., from his friends of the C.C.H.," was engraved upon it, with the date "1884." It was just such a stick as the old-fashioned family practitioner used to carry—dignified, solid, and reassuring.

"Well, Watson, what do you make of it?"

Holmes was sitting with his back to me, and I had given him no sign of my occupation.

"How did you know what I was doing? I believe you have eyes in the back of your head."

"I have, at least, a well-polished, silver-plated coffee-pot in front of me," said he. "But, tell me, Watson, what do you make of our visitor's stick? Since we have been so unfortunate as to miss him and have no notion of his errand, this accidental souvenir becomes of importance. Let me hear you reconstruct the man by an examination of it."

"I think," said I, following as far as I could the methods of my companion, "that Dr. Mortimer is a successful, elderly medical man, well-esteemed since those who know him give him this mark of their appreciation."

"Good!" said Holmes. "Excellent!"

"I think also that the probability is in favour of his being a country practitioner who does a great deal of his visiting on foot."

"Why so?"

"Because this stick, though originally a very handsome one has been so knocked about that I can hardly imagine a town practitioner carrying it. The thick-iron ferrule is worn down, so it is evident that he has done a great amount of walking with it."

"Perfectly sound!" said Holmes.
`, '', this.state.editorState //"text\nof\nthe\nsecond\nbook"
                )}
                type="button"
                value="Add second"
              />

            </div>
        );
    }
}
export default Smartbook
