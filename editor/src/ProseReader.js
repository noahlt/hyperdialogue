import React, { Component } from 'react';

const linkRegex = /(@)\[([^\]]*)\]\(([^\)]*)\)/g;

class Link extends Component {
  handleClick() {
    console.log('Link click');
    this.props.onClick(this.props.href);
  }

  render() {
    return <a
      href={'#' + this.props.href}
      onClick={this.handleClick.bind(this)}>
      {this.props.text}
    </a>;
  }
}

function fencepost(arr, separator) {
  const r = []
  for (var i=0; i<arr.length-1; i++) {
    r.push(arr[i]);
    r.push(separator);
  }
  r.push(arr[arr.length-1]);
  return r;
}

export default class ProseReader extends Component {
  constructor(props) {
    super(props);
    this.parseText = this.parseText.bind(this);
    this.navTo = this.navTo.bind(this);
  }

  navTo(nodeID) {
    console.log('ProseReader.navTo');
    this.props.setSelected(nodeID);
  }

  parseText(text) {
    if (text.length === 0) {
      return text;
    }

    const blobs = text.split(linkRegex);
    let r = [];
    for (var i = 0; i < blobs.length; i++) {
      if (blobs[i] === '@') {
        r.push(<Link text={blobs[i+1]} href={blobs[i+2]} onClick={this.navTo} />);
        i += 2;
      } else {
        r = r.concat(fencepost(blobs[i].split('\n'), <br />));
      }
    }

    return r;
  }

  render() {
    return <div style={style.wrapper}>
      {this.parseText(this.props.current.text)}
    </div>;
  }
}

const style = {
  wrapper: {
    marginLeft: 20,
    marginRight: 20,
  }
}