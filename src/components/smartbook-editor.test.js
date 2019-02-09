import React from 'react';
import ReactDOM from 'react-dom';
import SmartbookEditor from './smartbook-editor';
import ReactTestRenderer from 'react-test-renderer';
import { mount, shallow, unmount } from 'enzyme';
import KeyCode from 'keycode-js';
import sinon from 'sinon';
import {getDefaultKeyBinding} from "draft-js";
var assert = require('assert')

let mockCount = 0;
// IMPORTANT: Mocking randomness of Draft.js. Otherwise snapshot-tests will fail!
jest.mock('draft-js/lib/generateRandomKey', () => () => `key${mockCount++}`);

beforeEach(() => {
    // Otherwise the order of the tests becomes significant by virtue of participating in keys generation
    mockCount = 0;
});

it('test: No crash rendering test', () => {
    const div = document.createElement('div');
    ReactDOM.render(<SmartbookEditor />, div);
});

it('snapshot-check: Initial parameters', () => {
    const text1 = "1row1\n1row2";
    const text2 = "2row1\n2row2\n2row3";
    const tree = ReactTestRenderer
        .create(<SmartbookEditor 
                    textAlignment='left'
                    bookFirst={text1}
                    bookSecond={text2}
                    editorKey="mykey"
                />)
        .toJSON();
    expect(tree).toMatchSnapshot();
});


function createPasteEvent(html: string) {
  const text = html.replace('<[^>]*>', '');
  return {
    clipboardData: {
      types: ['text/plain', 'text/html'],
      getData: (type: string) => (type === 'text/plain' ? text : html),
    },
  };
}


it('snapshot-check: Insert into 1st book', () => {
    const pasteString = `text1
text2
text3`;
    const text1 = "1row1\n1row2";
    const text2 = "2row1\n2row2\n2row3";
    const editor = mount(<SmartbookEditor
                            textAlignment='left'
                            bookFirst={text1}
                            bookSecond={text2}
                         />);
                         
    const textArea = editor.find('.public-DraftEditor-content');

    textArea.simulate('paste', createPasteEvent(pasteString));

    expect(editor).toMatchSnapshot();
    editor.unmount();
});

it('snapshot-check: Insert into 2nd book', () => {
    const pasteString = `text1
text2
text3`;
    const text1 = "1row1\n1row2";
    const text2 = "2row1\n2row2\n2row3";
    const editor = mount(<SmartbookEditor
                            textAlignment='left'
                            bookFirst={text1}
                            bookSecond={text2}
                         />);
                         
    const textArea = editor.find('.public-DraftEditor-content');

    textArea.simulate('keyDown', {key: KeyCode.KEY_DOWN});
    textArea.simulate('paste', createPasteEvent(pasteString));

    expect(editor).toMatchSnapshot();
    editor.unmount();
});


it('snapshot-check: Keyboard Enter on the 2nd book', () => {
    const text1 = "1row1\n1row2";
    const text2 = "2row1\n2row2\n2row3";
    const editor = mount(<SmartbookEditor
                            textAlignment='left'
                            bookFirst={text1}
                            bookSecond={text2}
                         />);
                         
    const textArea = editor.find('.public-DraftEditor-content');

    textArea.simulate('keyDown', {key: KeyCode.KEY_DOWN});
    textArea.simulate('keyDown', {key: KeyCode.KEY_RIGHT});
    textArea.simulate('keyDown', {key: KeyCode.KEY_ENTER});

    expect(editor).toMatchSnapshot();
    editor.unmount();
});

it('snapshot-check: Keyboard Backspace on the 2nd book', () => {
    const text1 = "1row1\n1row2";
    const text2 = "2row1\n2row2\n2row3";
    const editor = mount(<SmartbookEditor
                            textAlignment='left'
                            bookFirst={text1}
                            bookSecond={text2}
                         />);
                         
    const textArea = editor.find('.public-DraftEditor-content');

    textArea.simulate('keyDown', {key: KeyCode.KEY_DOWN});
    textArea.simulate('keyDown', {key: KeyCode.KEY_RIGHT});
    textArea.simulate('keyDown', {key: KeyCode.KEY_BACK_SPACE});

    expect(editor).toMatchSnapshot();
    editor.unmount();
});