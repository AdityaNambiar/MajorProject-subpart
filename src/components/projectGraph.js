import React, { Component } from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";

class ProjectGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingModal: false,
      graph: "this is  a sample graph text",
    };
  }

  componentDidMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      this.setState({ loadingModal: false });
    }, 3000);
  }

  render() {
    let propsObj = this.props.location.state;
    let pname = propsObj.pname;
    return (
      <div>
        <NavBar />
        <div className="container">
          <h5 className="bg bg-warning sticky-top text-center">
            Project Name: {pname}
          </h5>
          {this.state.loadingModal ? (
            <lottie-player
              src="https://assets3.lottiefiles.com/packages/lf20_rWaqBk.json"
              background="transparent"
              speed="1"
              style={{ width: "1111px", height: "12px" }}
              loop
              autoplay
            ></lottie-player>
          ) : (
            <FadeIn>
              <div className="text-center bg bg-dark text-light">
                {this.state.graph}
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    );
  }
}
export default withRouter(ProjectGraph);
