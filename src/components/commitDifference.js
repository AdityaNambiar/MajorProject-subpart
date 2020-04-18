import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import "react-gh-like-diff/dist/css/diff2html.min.css";
import NavBar from "./navbar";

class CommitDifference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      past:
        "Est mollit ullamco cupidatat incididunt voluptate voluptate sunt. Enim minim sunt elit ipsum Lorem aliqua reprehenderit pariatur proident do voluptate ex voluptate. Laboris excepteur occaecat ut enim irure irure. Amet Lorem proident voluptate voluptate Lorem eu eu cupidatat enim ut tempor ea irure excepteur.",
      current:
        "Enim cillum cupidatat duis sunt sint deserunt sunt pariatur pariatur ea aute irure aute. Nisi cillum voluptate deserunt eu adipisicing sit est incididunt nulla minim cillum mollit. Enim aliquip Lorem ad pariatur ut sunt ad quis. Cupidatat laborum nostrud et Lorem. Ad Lorem enim fugiat excepteur nisi laboris velit fugiat ad duis eu. Qui nostrud qui ipsum laboris aute aliqua consequat anim sint commodo esse quis. Laboris laborum veniam cupidatat voluptate.",
      pastfname: "lorem.ipsum",
      currentfname: "lorem.ipsum",
    };
  }
  render() {
    let pastfname = this.state.pastfname;
    let currentfname = this.state.currentfname;
    let previousContent = this.state.past;
    let currentContent = this.state.current;
    return (
      <div>
        <NavBar />
        <div className="container mt-4">
          <ReactGhLikeDiff
            options={{
              originalFileName: pastfname,
              updatedFileName: currentfname,
              fileListToggle: true,
              outputFormat: "line-by-line",
              matching: "lines",
            }}
            past={previousContent}
            current={currentContent}
          />
        </div>
      </div>
    );
  }
}

export default withRouter(CommitDifference);
