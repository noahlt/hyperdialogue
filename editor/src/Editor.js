import React, { Component } from 'react';

import * as firebase from 'firebase/app';
import 'firebase/auth';

import _ from 'lodash';


import MindMap from './MindMap';
import ProseEditor from './ProseEditor';

import {colors} from './constants';
import ProseReader from './ProseReader';

const m = (...args) => {
  Object
}

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      doc: {},
      selected: null,
      readOnly: false,
      mouseX: 0,
      mouseY: 0,
    }
    this.setSelected = this.setSelected.bind(this);
    this.setDoc = this.setDoc.bind(this);
  }

  setSelected(nodeID) {
    console.log('Editor.setSelected');
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
    this.props.db.collection('dialogues').doc(this.props.docID).set({
      name: this.props.docName,
      owner: firebase.auth().currentUser.uid,
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
    this.props.db.collection('dialogues').doc(this.props.docID).get().then((doc) => {
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

  render() {
    let selectedNode = this.state.doc[this.state.selected];
    return <div style={{...this.props.style, ...styles.wrapper}}>
      <div style={styles.toolbar}>
        <ColorPicker onPickColor={this.onPickColor.bind(this)} />
        <input
          type="checkbox"
          id="readonly-chk"
          checked={this.state.readOnly}
          onChange={() => this.setState({readOnly: !this.state.readOnly})}
          />
        <label for="readonly-chk">readonly</label>
        <button onClick={this.clickSave.bind(this)}>save</button>
      </div>

      <div style={styles.mindMap}>
        <MindMap
          selectedNode={selectedNode}
          doc={this.state.doc}
          setSelected={this.setSelected}
          setDoc={this.setDoc}
          readOnly={this.state.readOnly}
          />
      </div>

      <div id="reader" style={styles.prose}>
        {selectedNode &&
          (this.state.readOnly
          ? <ProseReader
              current={selectedNode}
              setSelected={this.setSelected}
              />
          : <ProseEditor
              current={selectedNode}
              nodes={this.state.doc}
              onChange={this.changeText.bind(this)}
              />
          )
        }
      </div>
    </div>;
  }
}

const readerGutter = 10;

const styles = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 500px',
    gridTemplateRows: '50px 1fr',
    gridTemplateAreas: '"toolbar toolbar" "mindmap reader"',
  },
  toolbar: {
    gridArea: 'toolbar',
  },
  mindMap: {
    gridArea: 'mindmap',
  },
  prose: {
    gridArea: 'reader',
  },
};

const ColorPicker = (props) => (
  <div>
    {colors.map((c) =>
      <div
        key={c}
        className="colorswatch"
        style={{backgroundColor: c}}
        onClick={() => props.onPickColor(c)}
        />
    )}
  </div>
);

export default Editor;