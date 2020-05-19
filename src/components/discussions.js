import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Navbar from "./navbar";
import Forum from "./forum";

class Discussions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chatid:this.props.location.state.chatid
    };
  }
  render() {
   
    return (
      <div>
        <Navbar />
        <div className="container">
          <Forum forumFor={"project"} chatid={this.state.chatid} chatType="Collaborator"/> 
        </div>
      </div>
    );
  }
}

export default withRouter(Discussions);
