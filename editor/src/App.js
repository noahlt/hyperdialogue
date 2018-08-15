import React, { Component } from 'react';
import './App.css';

import * as firebase from 'firebase/app';
import 'firebase/firestore';

import _ from 'lodash';

import MindMap from './MindMap';
import ProseEditor from './ProseEditor';

firebase.initializeApp({
  apiKey: "AIzaSyCzyxSKeYlkMZBTaAIdJey-wkIHjMi-Uqg",
  authDomain: "hyperdialogue-8db83.firebaseapp.com",
  databaseURL: "https://hyperdialogue-8db83.firebaseio.com",
  projectId: "hyperdialogue-8db83",
  storageBucket: "",
  messagingSenderId: "223782799154"
});

var db = firebase.firestore();
db.settings({timestampsInSnapshots: true});

class App extends Component {
  constructor() {
    super();
    this.state = {
      doc: {},
      selected: null,
      mouseX: 0,
      mouseY: 0,
    }
    this.setSelected = this.setSelected.bind(this);
    this.setDoc = this.setDoc.bind(this);
  }

  setSelected(nodeID) {
    this.setState({selected: nodeID});
  }

  setDoc(newDoc) {
    this.setState({doc: newDoc});
  }

  onPickColor(c) {
    this.setState({
      doc: _.mapValues(this.state.doc, (node) => {
        if (node.nodeID === this.state.selected) {
          node.color = c;
        }
        return node;
      }),
    });
  }

  changeText(evt, x, y, z) {
    console.log(evt, x, y, z);
    this.setState({
      doc: _.mapValues(this.state.doc, (node) => {
        if (node.nodeID === this.state.selected) {
          node.text = evt.target.value;
        }
        return node;
      }),
    });
  }

  clickSave() {
    db.collection("dialogues").doc("test-00").set({
      name: "Test 00",
      nodes: this.state.doc,
    })
    .then(function() {
        console.log("Document successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document: ", error);
    });
  }

  componentDidMount() {
    document.addEventListener('keydown', this.keyDown);

    db.collection('dialogues').doc('test-00').get().then((doc) => {
      if (!doc.exists) {
        console.log('unable to load document');
        return;
      }
      console.log('loaded doc data', JSON.stringify(doc.data()));
      this.setState({
        doc: doc.data().nodes,
      });
    });
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keyDown);
  }

  render() {
    let selectedNode = this.state.doc[this.state.selected];
    return <div className="App">
      <MindMap
        selectedNode={selectedNode}
        doc={this.state.doc}
        setSelected={this.setSelected}
        setDoc={this.setDoc}
        />

      <button onClick={this.clickSave.bind(this)}>save</button>
      <ColorPicker onPickColor={this.onPickColor.bind(this)} />

      <div id="reader">
        {selectedNode &&
          <ProseEditor
            current={selectedNode}
            nodes={this.state.doc}
            onChange={this.changeText.bind(this)}
            />
        }
      </div>
    </div>;
  }
}

const ColorPicker = (props) => (
  <div>
    {['#DFBAB1', '#EECDCD', '#F8E5D0', '#FDF2D0', '#DCE9D5',
      '#D3E0E2', '#CCDAF5', '#D2E2F1', '#D8D3E7', '#E6D2DB'].map((c) =>
      <div
        key={c}
        className="colorswatch"
        style={{backgroundColor: c}}
        onClick={() => props.onPickColor(c)}
        />
    )}
  </div>
);


export default App;
