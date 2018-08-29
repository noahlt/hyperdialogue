import React, { Component } from 'react';
import './MindMap.css';

import {mode, defaultColor} from './constants';
import _ from 'lodash';

import Box from './Box';

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

const modeLabel = (mode) =>
  ['default', 'selected', 'connecting', 'typing', 'linkSelected', 'noop'][mode];

const debug = false;

export default class MindMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: mode.default,
      hasFocus: false,
      hover: null,
    }
    this.svgRef= React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  // getMouseCoordinates takes a DOM Mouse Event and returns x and y
  // coordinates relative to the top left corner of the svg element
  // (ie, relative to (0,0) in the drawing context).  Raw Mouse Events
  // only give coordinates relative to the Document or browser window.
  getMouseCoordinates(evt) {
    let svgRect = this.svgRef.current.getBoundingClientRect();
    return [evt.pageX - svgRect.left, evt.pageY - svgRect.top];
  }

  mouseDownEmpty(evt) {
    if (this.state.mode === mode.selected) {
      this.props.setSelected(null);
      // noop is just a mode like default, only exists so that when we hit
      // mouseUpEmpty (below) in this state we won't create a new node.
      this.setState({mode: mode.noop});
    }
  }

  mouseMoveEmpty(evt) {
    if (this.props.readOnly) {
      return;
    }
    if (this.state.mode === mode.connecting) {
      let [x, y] = this.getMouseCoordinates(evt);
      this.setState({
        mouseX: x,
        mouseY: y,
      });
    } else if (this.state.mode === mode.selected && evt.buttons === 1) {
      let [mouseX, mouseY] = this.getMouseCoordinates(evt);
      this.props.setDoc(_.mapValues(this.props.doc, (node) => {
        if (node.nodeID === this.props.selectedNode.nodeID) {
          node.cx = mouseX;
          node.cy = mouseY;
        }
        return node;
      }));
    }
  }

  clickEmpty(evt) {
    if (this.state.mode === mode.default && !this.props.selectedNode && !this.props.readOnly) {
      let [mouseX, mouseY] = this.getMouseCoordinates(evt);
      let newNode = {
        nodeID: guid(),
        cx: mouseX,
        cy: mouseY,
        label: '',
        color: defaultColor,
        links: [],
        text: [],
      };
      let docUpdate = {};
      docUpdate[newNode.nodeID] = newNode;
      this.props.setDoc(Object.assign({}, this.props.doc, docUpdate));
      this.props.setSelected(newNode.nodeID);
      this.setState({mode: mode.selected});
    } else {
      this.props.setSelected(null);
      this.setState({
        hover: null,
        mode: mode.default,
      });
    }
  }

  handleFocus(evt) {
    this.setState({hasFocus: true});
  }

  handleBlur() {
    this.setState({hasFocus: false});
  }

  clickNode(nodeID, evt) {
    evt.stopPropagation();
    this.svgRef.current.focus();
    this.props.setSelected(nodeID);
    this.setState({
      mode: mode.selected,
      hasFocus: true,
    });
  }

  mouseMoveNode(nodeID, evt) {
    if (this.state.mode === mode.connecting && nodeID !== this.props.selectedNode.nodeID) {
      this.setState({
        hover: nodeID,
      });
    }
  }

  mouseDownNode(nodeID, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.props.readOnly) {
      return;
    }
    if (!this.props.selectedNode || (this.props.selectedNode && this.props.selectedNode.nodeID !== nodeID)) {
      this.props.setSelected(nodeID);
      const [mouseX, mouseY] = this.getMouseCoordinates(evt);
      this.setState({
        hasFocus: true,
        mode: mode.connecting,
        mouseX: mouseX,
        mouseY: mouseY,
      });
    }
  }

  mouseUpNode(nodeID, evt) {
    if (this.state.mode === mode.connecting) {
      evt.stopPropagation();
      if (!this.props.selectedNode || nodeID !== this.props.selectedNode.nodeID) {
        this.props.setDoc(_.mapValues(this.props.doc, (node) => {
          if (node.nodeID === this.props.selectedNode.nodeID) {
            node.links.push(nodeID);
          }
          return node;
        }));
      }
      this.props.setSelected(nodeID);
      this.setState({mode: mode.selected});
    }
  }

  handleKeyDown(evt) {
    if (!this.state.hasFocus || this.props.readOnly) {
      return;
    }
    evt.preventDefault();
    if (evt.key === 'Escape') {
      this.props.setSelected(null);
      this.setState({
        hover: null,
        mode: mode.default,
      });
      return;
    }
    if (this.state.mode === mode.selected) {
      if (evt.key === 'Backspace') {
        this.props.setDoc(_.omit(this.props.doc, this.props.selectedNode.nodeID));
        this.props.setSelected(null);
        this.setState({
          mode: mode.default,
        });
      } else if (evt.key.length === 1) {
        this.props.setDoc(_.mapValues(this.props.doc, (node) => {
          if (node.nodeID === this.props.selectedNode.nodeID) {
            node.label = evt.key;
          }
          return node;
        }));
        this.setState({mode: mode.typing});
      }
    } else if (this.state.mode === mode.typing) {
      if (evt.key === 'Enter') {
        this.setState({
          mode: mode.selected,
        });
      } if (evt.key === 'Backspace') {
        this.props.setDoc(_.mapValues(this.props.doc, (node) => {
          if (node.nodeID === this.props.selectedNode.nodeID) {
            node.label = node.label.slice(0, -1);
          }
          return node;
        }));
      } else if (evt.key.length === 1) {
        this.props.setDoc(_.mapValues(this.props.doc, (node) => {
          if (node.nodeID === this.props.selectedNode.nodeID) {
            node.label += evt.key;
          }
          return node;
        }));
      }
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  render() {
    let selectedNode = this.props.selectedNode;
    let links = _.uniq(_.flatten(
      _.map(_.values(this.props.doc), (node) =>
        _.map(node.links, (linkID) => {
          let pair = _.sortBy([node.nodeID, linkID]);
          return {a: pair[0], b: pair[1]};
        })
      )
    ));
    let linkedNodes = _.map(links, (pair) => ({a: this.props.doc[pair.a], b: this.props.doc[pair.b]}));
    let validLinks = _.filter(linkedNodes, (pair) => pair.a && pair.b); // only keep links where both ends are non-null

    return <svg
      id="generated-svg"
      ref={this.svgRef}
      width="auto"
      height="100%"
      version="1.1"
      tabIndex="0"
      onMouseDown={this.mouseDownEmpty.bind(this)}
      onMouseMove={this.mouseMoveEmpty.bind(this)}
      onClick={this.clickEmpty.bind(this)}
      onFocus={this.handleFocus.bind(this)}
      onBlur={this.handleBlur.bind(this)}
      >
      {this.state.mode === mode.connecting && selectedNode &&
        <line x1={selectedNode.cx} y1={selectedNode.cy} x2={this.state.mouseX} y2={this.state.mouseY} stroke="#aaa" />
      }
      {validLinks.map((pair) =>
        <line x1={pair.a.cx} y1={pair.a.cy} x2={pair.b.cx} y2={pair.b.cy} stroke="#aaa" />
      )}
      {Object.values(this.props.doc).map((node) =>
        <Box
          key={node.nodeID}
          highlightBorder={(selectedNode && selectedNode.nodeID === node.nodeID) || (this.state.hover === node.nodeID)}
          highlightText={selectedNode && selectedNode.nodeID === node.nodeID && this.state.mode === mode.typing}
          onClick={this.clickNode.bind(this, node.nodeID)}
          onMouseMove={this.mouseMoveNode.bind(this, node.nodeID)}
          onMouseDown={this.mouseDownNode.bind(this, node.nodeID)}
          onMouseUp={this.mouseUpNode.bind(this, node.nodeID)}
          {...node}
          />
      )}
      {debug && <text x={0} y={0} alignmentBaseline="hanging">{modeLabel(this.state.mode)}</text>}
    </svg>;
  }
}
