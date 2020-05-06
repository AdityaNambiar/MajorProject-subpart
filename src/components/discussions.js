import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Navbar from "./navbar";
import Forum from "./forum";

class Discussions extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <div>
        <Navbar />
        <div className="container">
          <Forum forumFor={"project"} />
        </div>
      </div>
    );
  }
}

export default withRouter(Discussions);
