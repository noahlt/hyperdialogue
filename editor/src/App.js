import React, { Component } from 'react';
import './App.css';

import * as firebase from 'firebase/app';
import 'firebase/firestore';

import _ from 'lodash';

import ProseEditor from './ProseEditor';

const defaultColor = '#FFFFDE';

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

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

class Box extends Component {
  constructor(props) {
    super(props);
    this.emptyBBox = {width: 0, height: 14};
    this.state = { bbox: this.emptyBBox };
    this.textRef= React.createRef();
  }

  componentDidUpdate() {
    const newBBox = this.textRef.current.getBBox();
    if (newBBox.width !== this.state.bbox.width) {
      this.setState({bbox: newBBox});
    }
  }

  componentDidMount() {
    if (this.props.label.length > 0) {
      this.setState({ bbox: this.textRef.current.getBBox()});
    } else {
      this.setState({ bbox: this.emptyBBox });
    }
  }

  render() {
    return <g
      key={this.props.nodeID}
      id={this.props.nodeID}
      onClick={this.props.onClick}
      onMouseDown={this.props.onMouseDown}
      onMouseMove={this.props.onMouseMove}
      onMouseUp={this.props.onMouseUp}
      >
      {this.state.bbox &&
        <rect
          x={this.props.cx - this.state.bbox.width/2 - 10}
          y={this.props.cy - this.state.bbox.height/2 - 5}
          width={this.state.bbox.width + 20}
          height={this.state.bbox.height + 10}
          rx={5}
          ry={5}
          stroke={this.props.highlightBorder ? '#33f' : 'none'}
          fill={this.props.color}
          />
      }
      <text
        ref={this.textRef}
        x={this.props.cx}
        y={this.props.cy}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily='Helvetica'
        fontSize='12'
        fill={this.props.highlightText ? '#33f' : '#333'}
        >
        {this.props.label}
      </text>
    </g>;
  }
}

const modeDefault = 0;
const modeSelected = 1;
const modeConnecting = 2;
const modeTyping = 3;
const modeLinkSelected = 4;

class App extends Component {
  constructor() {
    super();
    this.state = {
      doc: {},
      focusMindMap: false, // this should be extracted to MindMap component
      selected: null,
      mode: modeDefault,
      mouseX: 0,
      mouseY: 0,
    }
    this.svgRef= React.createRef(); // MindMap component
    this.keyDown = this.keyDown.bind(this);
  }

  clickNode(nodeID, evt) {
    console.log('clickNode', evt);
    evt.stopPropagation();
    this.svgRef.current.focus();
    this.setState({
      selected: nodeID,
      mode: modeSelected,
      focusMindMap: true,
    });
  }

  mouseMoveNode(nodeID, evt) {
    // console.log('app.mouseMoveNode', nodeID, evt.buttons, evt.pageX, evt.pageY);
    if (this.state.mode === modeDefault && evt.buttons === 1) {
      this.setState({
        selected: nodeID,
        focusMindMap: true,
        mode: modeConnecting,
        mouseX: evt.clientX,
        mouseY: evt.clientY,
      });
    } else if (this.state.mode === modeConnecting && nodeID !== this.state.selected) {
      this.setState({
        hover: nodeID,
      });
    } else if (this.state.mode === modeSelected && nodeID === this.state.selected && evt.buttons === 1) {
      this.setState({
        doc: _.mapValues(this.state.doc, (node) => {
          if (node.nodeID === this.state.selected) {
            node.cx = evt.clientX;
            node.cy = evt.clientY;
          }
          return node;
        }),
      })
    }
  }

  mouseDownNode(nodeID, evt) {
    evt.preventDefault();
  }

  mouseUpNode(nodeID, evt) {
    if (this.state.mode === modeConnecting) {
      this.setState({
        doc: _.mapValues(this.state.doc, (node) => {
          if (node.nodeID === this.state.selected) {
            node.links.push(nodeID);
          }
          return node;
        }),
      });
    }
  }

  mouseMoveEmpty(evt) {
    if (this.state.mode === modeConnecting) {
      this.setState({
        mouseX: evt.clientX,
        mouseY: evt.clientY,
      });
    }
  }

  clickEmpty(evt) {
    if (this.state.mode === modeDefault && this.state.selected === null) {
      let newNode = {
        nodeID: guid(),
        cx: evt.clientX,
        cy: evt.clientY,
        label: '',
        color: defaultColor,
        links: [],
        text: [],
      };
      this.state.doc[newNode.nodeID] = newNode;
      this.setState({
        doc: this.state.doc,
        mode: modeSelected,
        selected: newNode.nodeID,
      });
    } else {
      this.setState({
        selected: null,
        hover: null,
        mode: modeDefault,
      });
    }
  }

  keyDown(evt) {
    if (!this.state.focusMindMap) {
      return;
    }
    console.log(evt);
    evt.preventDefault();
    if (evt.key === 'Escape') {
      this.setState({
        selected: null,
        hover: null,
        mode: modeDefault,
      });
      return;
    }
    if (this.state.mode === modeSelected) {
      if (evt.key === 'Backspace') {
        delete this.state.doc[this.state.selected];
        this.setState({
          doc: this.state.doc,
          mode: modeDefault,
          selected: null,
        });
      } else if (evt.key.length === 1) {
        this.setState({
          doc: _.mapValues(this.state.doc, (node) => {
            if (node.nodeID === this.state.selected) {
              node.label = evt.key;
            }
            return node;
          }),
          mode: modeTyping,
        });
      }
    } else if (this.state.mode === modeTyping) {
      if (evt.key === 'Enter') {
        this.setState({
          mode: modeSelected,
        });
      } else if (evt.key.length === 1) {
        this.setState({
          doc: _.mapValues(this.state.doc, (node) => {
            if (node.nodeID === this.state.selected) {
              node.label += evt.key;
            }
            return node;
          }),
        });
      }
    }
  }

  blurMindMap() {
    console.log("BLUR mind map!");
    this.setState({
      focusMindMap: false,
    });
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
      console.log('loaded doc data', doc.data());
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
    let links = _.uniq(_.flatten(
      _.map(_.values(this.state.doc),
            (node) => _.map(node.links,
                            (linkID) => {
                              let pair = _.sortBy([node.nodeID, linkID]);
                              return {a: pair[0], b: pair[1]};
                            }))));
    let linkedNodes = _.map(links, (pair) => ({a: this.state.doc[pair.a], b: this.state.doc[pair.b]}));
    let validLinks = _.filter(linkedNodes, (pair) => pair.a && pair.b); // only keep links where both ends are non-null
    return <div className="App">
      <svg
        id="generated-svg"
        ref={this.svgRef}
        width="1000px"
        height="500px"
        viewBox="0 0 1000 500"
        version="1.1"
        tabIndex="0"
        onMouseMove={this.mouseMoveEmpty.bind(this)}
        onClick={this.clickEmpty.bind(this)}
        onBlur={this.blurMindMap.bind(this)}
        >
        {this.state.mode === modeConnecting && selectedNode &&
          <line x1={selectedNode.cx} y1={selectedNode.cy} x2={this.state.mouseX} y2={this.state.mouseY} stroke="#aaa" />
        }
        {validLinks.map((pair) =>
          <line x1={pair.a.cx} y1={pair.a.cy} x2={pair.b.cx} y2={pair.b.cy} stroke="#aaa" />
        )}
        {Object.values(this.state.doc).map((node) =>
          <Box
            key={node.nodeID}
            highlightBorder={(this.state.selected === node.nodeID) || (this.state.hover === node.nodeID)}
            highlightText={this.state.selected === node.nodeID && this.state.mode === modeTyping}
            onClick={this.clickNode.bind(this, node.nodeID)}
            onMouseMove={this.mouseMoveNode.bind(this, node.nodeID)}
            onMouseDown={this.mouseDownNode.bind(this, node.nodeID)}
            onMouseUp={this.mouseUpNode.bind(this, node.nodeID)}
            {...node}
            />
        )}
      </svg>

      <button onClick={this.clickSave.bind(this)}>save</button>
      <ColorPicker onPickColor={this.onPickColor.bind(this)} />

      <div id="reader">
        {this.state.mode === modeSelected && selectedNode &&
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
