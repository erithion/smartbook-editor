import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';

import SmartbookEditor from './components/smartbook-editor'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { text1: "1row1\n1row2"
                 , text2: "2row1\n2row2\n2row3"
                 , id: ""};
  }

  render() {
    
    return (
      <div className="App">
        <SmartbookEditor 
            textAlignment='left'
            bookFirst={this.state.text1}
            bookSecond={this.state.text2}
            // causes React to re-create the component any time the key has changed
            key={this.state.id}
        />
        
        <input
            onClick={e => this.setState({text1: "vcnvbncvbnvcb", id: new Date().getTime().toString() })}
            type="button"
            value="Add first"
        />
        <input
            onClick={e => this.setState({text2: "asdasdasdads", id: new Date().getTime().toString() })}
            type="button"
            value="Add second"
        />
      </div>
    );
  }
}

export default App;
