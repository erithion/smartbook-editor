import React from 'react';
import Draft from 'draft-js';
import './smartbook-editor.css';

class SmartbookBlock extends React.Component {
    render() {
        const {css} = this.props.blockProps;
        return (
            <div className={css}>
                <Draft.EditorBlock {...this.props} />
            </div>
        );
    }
}

export function smartbookEditorRendererFn(contentBlock) {
    const type = contentBlock.getType();
    if (type === 'unstyled') {
        var val = '';
        if (contentBlock.data.book === 'first') val = 'first-book-block';
        else if (contentBlock.data.book === 'second') val = 'second-book-block';
        return {
            component: SmartbookBlock,
            props: {
                css: val,
            },
        };
    }
}

export default SmartbookBlock
