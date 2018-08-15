import React, { Component } from 'react';

import { MentionsInput, Mention } from 'react-mentions';

import _ from 'lodash';


export default class ProseEditor extends Component {
  insertLink(nodeID) {
    console.log(nodeID, this.props.nodes[nodeID].label);
  }

  render() {
    var text = this.props.current.text;
    if (Array.isArray(text)) {
      text = text.map((x) => {
        if (typeof x === 'string') {
          return x;
        } else if (typeof x === 'object') {
          return `@[${x.text}](${x.link})`
        } else {
          return '';
        }
      }).join('');
    }

    const inboundLinks = _.flatMap(Object.values(this.props.nodes), (node) => {
      if (_.find(node.links, (link) => link === this.props.current.nodeID)) {
        return [node.nodeID];
      } else {
        return [];
      }
    });

    const mentions = _.map(inboundLinks.concat(this.props.current.links), (linkID) =>
      ({id: linkID, display: this.props.nodes[linkID].label}));

    return <div>
      <div style={{width: 700}}>
        <MentionsInput value={text} onChange={this.props.onChange} style={mentionInputStyle}>
          <Mention
            trigger="@"
            data={mentions}
            style={mentionStyle}
          />
        </MentionsInput>
      </div>
    </div>;
  }
}

const mentionStyle = {
  backgroundColor: '#cee4e5',
};

const mentionInputStyle = {
  control: {
    backgroundColor: '#fff',

    fontSize: 12,
    fontWeight: 'normal',
  },

  highlighter: {
    overflow: 'hidden',
  },

  input: {
    margin: 0,
    height: 300,
    overflow: 'auto',
    //width: 700,
  },

  '&singleLine': {
    control: {
      display: 'inline-block',

      width: 130,
    },

    highlighter: {
      padding: 1,
      border: '2px inset transparent',
    },

    input: {
      padding: 1,

      border: '2px inset',
    },
  },

  '&multiLine': {
    control: {
      fontFamily: 'monospace',

      border: '1px solid silver',
    },

    highlighter: {
      padding: 9,
    },

    input: {
      padding: 9,
      minHeight: 63,
      outline: 0,
      border: 0,
    },
  },

  suggestions: {
    list: {
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.15)',
      fontSize: 10,
    },

    item: {
      padding: '5px 15px',
      borderBottom: '1px solid rgba(0,0,0,0.15)',

      '&focused': {
        backgroundColor: '#cee4e5',
      },
    },
  },
};