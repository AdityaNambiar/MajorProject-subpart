/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";

class CommitHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pname: this.props.pname,
      projectCommits: [],
      commitOf: this.props.commitOf,
      shortHash: "",
      loadingModal: false,
    };
    this.handleCommitMsg = this.handleCommitMsg.bind(this);
    this.handleCommitHash = this.handleCommitHash.bind(this);
  }

  componentWillMount() {
    let commitOf = this.state.commitOf;
    if (commitOf === "fileCommit") {
      this.setState({ loadingModal: true });
      setTimeout(() => {
        fetch("http://localhost:3000/fileCommits")
          .then((res) => res.json())
          .then((data) =>
            this.setState({ projectCommits: data, loadingModal: false })
          );
      }, 3000);
    } else {
      this.setState({ loadingModal: true });
      setTimeout(() => {
        fetch("http://localhost:3000/projectCommits")
          .then((res) => res.json())
          .then((data) =>
            this.setState({ projectCommits: data, loadingModal: false })
          );
      }, 3000);
    }
  }

  handleCommitMsg = (e) => {
    e.preventDefault();
    let hash = e.target.name;
    this.props.history.push("./commitDifference");
    console.log(hash);
  };

  handleCommitHash = (e) => {
    e.preventDefault();
    let hash = e.target.name;
    let pname = e.target.id;
    this.props.history.push("./project", { pname: pname });
    window.location.reload();
    console.log(hash);
  };

  render() {
    let pname = this.state.pname;
    const projectCommitList = this.state.projectCommits.map((projectCommit) => (
      <tr>
        <td>
          <small>{projectCommit.name}</small>
        </td>
        <td>
          <a
            href="#"
            name={projectCommit.hash}
            onClick={this.handleCommitMsg}
            data-dismiss="modal"
          >
            <small>{projectCommit.message}</small>
          </a>
        </td>
        <td>
          <small>
            <a
              href="#"
              name={projectCommit.hash}
              id={pname}
              onClick={this.handleCommitHash}
              data-dismiss="modal"
            >
              {projectCommit.hash}
            </a>
          </small>
        </td>
        <td>
          <small>{projectCommit.date}</small>
        </td>
      </tr>
    ));
    return (
      <React.Fragment>
        {this.state.loadingModal ? (
          <lottie-player
            src="https://assets10.lottiefiles.com/packages/lf20_obP8oy.json"
            background="transparent"
            speed="1"
            style={{ width: "500px", height: "300px" }}
            loop
            autoplay
          ></lottie-player>
        ) : (
          <FadeIn>
            <table class="table table-hover table-sm">
              <thead>
                <tr>
                  <th scope="col">By</th>
                  <th scope="col">Commit message</th>
                  <th scope="col"> Hash</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>{projectCommitList}</tbody>
            </table>
          </FadeIn>
        )}
      </React.Fragment>
    );
  }
}

export default withRouter(CommitHistory);
