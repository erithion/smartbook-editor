import React from 'react';
import Draft from 'draft-js';
import Imm from 'immutable';
import './Book.css';

class BookBlock extends React.Component {
	render() {
		const {block, contentState} = this.props;
		const {css} = this.props.blockProps;
		return (
			<div className={css}>
				<Draft.EditorBlock {...this.props} />
			</div>
		);
	}
}

function myBlockRenderer(contentBlock) {
	const type = contentBlock.getType();
	if (type === 'unstyled') {
		var val = '';
		if (contentBlock.data.book === 'first') val = 'first-book-block';
		else if (contentBlock.data.book === 'second') val = 'second-book-block';
		return {
			component: BookBlock,
			props: {
				css: val,
			},
		};
	}
}

class Smartbook extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			editorState: Draft.EditorState.createEmpty()
		};
	}

	onChange = (editorState) => {
		this.setState({
			editorState
		})
	}

	handleReturn = (evt) => {
		const { editorState } = this.state;

		var   currentContent = editorState.getCurrentContent();
		var   selectionState = editorState.getSelection();

		var   currentKey = selectionState.getFocusKey();
		var   nextKey = currentContent.getKeyAfter(currentKey);
		var   currentBlock = currentContent.getBlockForKey(currentKey);
		var   nextBlock = currentContent.getBlockAfter(currentKey);

		if (nextBlock) {
			// Exchanging the current paragraph with the one below
			var   selectionFrom = Draft.SelectionState.createEmpty(currentKey)
					.set('focusOffset', currentBlock.getLength())
					.set('anchorOffset', 0)
					.set('hasFocus', true);
			var   selectionTo = Draft.SelectionState.createEmpty(nextKey)
					.set('focusOffset', nextBlock.getLength())
					.set('anchorOffset', 0);
			var   textFrom = currentBlock.getText();
			var   textTo = nextBlock.getText();

			var   newContent = Draft.Modifier.replaceText(currentContent, selectionFrom, textTo);
				  newContent = Draft.Modifier.replaceText(newContent, selectionTo, textFrom);

			// Moving the cursor down at the moved paragraph
			var   newFocusSelection = Draft.SelectionState.createEmpty(nextKey);
			const newState = Draft.EditorState.forceSelection(Draft.EditorState.createWithContent(newContent), newFocusSelection);

			// Applying the changes
			this.onChange(newState);
			return 'handled';
		}
		return 'not-handled';
	}
  
	makeContentBlock = (blockText, bookType) => new Draft.ContentBlock({
		key: Draft.genKey(),
		type: 'unstyled',
		text: blockText,
		data: { book: bookType }
	});
  
	padListSize = (listFirst, listSecond) => {
		const max = Math.max(listFirst.count(), listSecond.count());
		
		return { 
			first: listFirst.concat( Imm.Repeat(null, max - listFirst.count()) ),
			second: listSecond.concat( Imm.Repeat(null, max - listSecond.count()) )
	   };
	}
  
	addFirst = (text, e) => {
		const { editorState } = this.state;
		const content = editorState.getCurrentContent();
		const focusBlock = content.getBlockForKey(editorState.getSelection().getFocusKey());

		const blocks = content.getBlockMap();
		const beforeFocus = blocks.toSeq().takeUntil(block => block === focusBlock).toArray();
		const afterFocus = blocks.toSeq().skipUntil(block => block === focusBlock).toArray();
		
		// filtered only one book contentBlocks
		const firstBook = afterFocus.filter(block => block.data.book === 'first');
		const secondBook = afterFocus.filter(block => block.data.book === 'second');

		var   contentBlocksArray = text.split('\n').map(word => this.makeContentBlock(word, 'first'));
			  contentBlocksArray = contentBlocksArray.concat(firstBook);

		var   {first, second} = this.padListSize(Imm.List(contentBlocksArray), Imm.List(secondBook));
			  first = first.map(block => block ? block : this.makeContentBlock("", 'first'));
			  second = second.map(block => block ? block : this.makeContentBlock("", 'second'));
			  contentBlocksArray = first.interleave(second).toArray();
			  contentBlocksArray = beforeFocus.concat(contentBlocksArray);

		// Applying the changes
		const newState = Draft.EditorState.createWithContent(Draft.ContentState.createFromBlockArray(contentBlocksArray));
		this.onChange(newState);
	}
	
	addSecond = (text, e) => {
		const test = text.split('\n').map(word => 
			new Draft.ContentBlock({
				key: Draft.genKey(),
				type: 'unstyled',
				text: word,
				data: { book: 'second' }
			}));

			
		// Applying the changes
		this.onChange(Draft.EditorState.createWithContent(Draft.ContentState.createFromBlockArray(test)));
	}
	
	render() {
		return (
			<div>
			<Draft.Editor
				editorState={this.state.editorState}
				onChange={this.onChange}
				handleReturn={this.handleReturn}
				blockRendererFn={myBlockRenderer}
			/>
	  
	  
	                <input
                onClick={this.addFirst.bind(this, 
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
                type="button"
                value="Add first"
              />
	                <input
                onClick={this.addSecond.bind(this, 
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
` //"text\nof\nthe\nsecond\nbook"
				)}
                type="button"
                value="Add second"
              />

			</div>
		);
	}
}
export default Smartbook
