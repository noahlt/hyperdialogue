import React, { Component } from 'react';
import './App.css';

import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import _ from 'lodash';

import Editor from './Editor';

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
      const path = new URL(window.location).pathname.split('/');
      if (path.length === 3 && path[1] === 'edit') {
        const docFromURL = _.find(snapshot.docs, (doc) => doc.id === path[2]);
        if (docFromURL) {
          this.setState({openDoc: {id: docFromURL.id, name: docFromURL.data().name}});
        } else {
          // couldn't find the doc, so let's remove it from the URL
          window.history.pushState({docID: null}, '', '/');
        }
      }
    });
  }

  open(listing, evt) {
    this.setState({openDoc: listing});
    window.history.pushState({docID: listing.id}, listing.name, `edit/${listing.id}`);
  }

  close() {
    this.setState({openDoc: null});
    window.history.pushState({docID: null}, '', '/');
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
      return <div style={styles.wrapper}>
        <div style={styles.title}>
          <span style={{cursor: 'pointer'}} onClick={this.close.bind(this)}>💬</span>
          <span>{this.state.openDoc.name}</span>
        </div>
        <Editor
          style={styles.editor}
          docID={this.state.openDoc.id}
          docName={this.state.openDoc.name}
          db={db} />
      </div>
    }
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
  },
  wrapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '50px 1fr',
    gridTemplateAreas: '"title" "editor"',
  },
  title: {
    gridArea: 'title',
  },
  editor: {
    gridArea: 'editor'
  }
};

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

export default App;
