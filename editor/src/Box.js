import React, { Component } from 'react';


export default class Box extends Component {
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
