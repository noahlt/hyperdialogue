import React, { Component } from 'react';
import './App.css';

import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import _ from 'lodash';

import MindMap from './MindMap';
import ProseEditor from './ProseEditor';

import {colors} from './constants';

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
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      // true after user clicks 'login' but before redirect loads:
      redirecting: false,
    };
  }

  login() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
    this.setState({redirecting: true});
  }

  componentDidMount() {
    console.log('getting auth redirect result...');
    firebase.auth().getRedirectResult().then((result) => {
      if (result.credential) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        //var token = result.credential.accessToken;
      }
      this.setState({loading: false});
    }).catch(function(error) {
      console.error('failed to authenticate', error.code, error.message, error.email);
    });
  }

  render() {
    if (this.state.loading) {
      return <div>Loading...</div>;
    }
    if (firebase.auth().currentUser) {
      console.log(firebase.auth().currentUser);
      return <LoggedIn />;
    } else {
      return <div>
        <div>We are logged out.</div>
        <button
          onClick={this.login.bind(this)}
          disabled={this.state.redirecting}>
          Log in
        </button>
      </div>;
    }
  }
}

class LoggedIn extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      openDoc: null,
      docList: [],
    };
  }

  componentDidMount() {
    db.collection('dialogues').where("owner", "==", firebase.auth().currentUser.uid).get().then((snapshot) => {
      console.log(snapshot);
      this.setState({
        loading: false,
        docList: snapshot.docs.map((doc) => ({id: doc.id, name: doc.data().name}))
      });
    })
  }

  open(listing, evt) {
    this.setState({openDoc: listing});
  }

  close() {
    this.setState({openDoc: null});
  }

  createNew(name) {
    // todo: save this in the background and immediately open new doc
    db.collection('dialogues').add({
      name: name,
      owner: firebase.auth().currentUser.uid,
      nodes: {},
    }).then((docRef) => {
      this.setState({
        openDoc: {id: docRef.id, name: name},
      });
    });
  }

  render() {
    if (this.state.loading) {
      return <div>
        Loading...
      </div>;
    } else if (this.state.openDoc === null) {
      return <div>
        <div>
          Create a new hyperdialogue:
          <DocCreator onEnter={this.createNew.bind(this)}/>
        </div>
        <div>
          Open an existing hyperdialogue:
          {this.state.docList.map((listing) =>
            <div
              style={styles.docMenuItem}
              key={listing.id}
              onClick={this.open.bind(this, listing)}>
              {listing.name}
            </div>
          )}
        </div>
      </div>;
    } else {
      return <div>
        <div style={{fontSize: 30}}>
          <span style={{cursor: 'pointer'}} onClick={this.close.bind(this)}>💬</span>
          <span>{this.state.openDoc.name}</span>
        </div>
        <Editor docID={this.state.openDoc.id} docName={this.state.openDoc.name} />
      </div>
    }
  }
}

class DocCreator extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
    };
  }

  render() {
    return <div>
      <input
        type="text"
        value={this.state.title}
        onChange={(e) => this.setState({title: e.target.value})}
        />
      <button onClick={() => this.props.onEnter(this.state.title)}>
        create
      </button>
    </div>
  }
}

const styles = {
  docMenuItem: {
    padding: 10,
    margin: 10,
    border: '1px solid #999',
    color: '#444',
    width: 150,
    cursor: 'pointer',
  }
};

class Editor extends Component {
  constructor(props) {
    super(props);
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
    db.collection("dialogues").doc(this.props.docID).set({
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
    db.collection('dialogues').doc(this.props.docID).get().then((doc) => {
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
    return <div className="App">
      <ColorPicker onPickColor={this.onPickColor.bind(this)} />
      <MindMap
        selectedNode={selectedNode}
        doc={this.state.doc}
        setSelected={this.setSelected}
        setDoc={this.setDoc}
        />

      <button onClick={this.clickSave.bind(this)}>save</button>

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


export default App;
