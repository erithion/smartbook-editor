import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';

import SmartbookEditor from './components/smartbook-editor'

class App extends Component {
  render() {
    return (
      <div className="App">
        <SmartbookEditor />
      </div>
    );
  }
}

export default App;
