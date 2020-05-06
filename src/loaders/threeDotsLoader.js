import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Lottie from "react-lottie";
import animationData from "./threedots.json";

class ThreeDotsLoader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      height: this.props.height,
      width: this.props.width,
    };
  }
  render() {
    let width = this.state.width;
    let height = this.state.height;
    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };

    return <Lottie options={defaultOptions} height={height} width={width} />;
  }
}

export default withRouter(ThreeDotsLoader);
