import React from 'react';
import Draft from 'draft-js';
import './Book.css';

class Smartblock extends React.Component {
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

export function smartRenderer(contentBlock) {
    const type = contentBlock.getType();
    if (type === 'unstyled') {
        var val = '';
        if (contentBlock.data.book === 'first') val = 'first-book-block';
        else if (contentBlock.data.book === 'second') val = 'second-book-block';
        return {
            component: Smartblock,
            props: {
                css: val,
            },
        };
    }
}

export default Smartblock
