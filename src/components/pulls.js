import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";
import Barloader from "../loaders/barLoader";
import NavBar from "./navbar";

class Pulls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingModal: false,
      pulls: [],
      fileArray: [],
    };
  }

  componentDidMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/pulls")
        .then((res) => res.json())
        .then((pulls) => this.setState({ pulls: pulls }));

      fetch("http://localhost:3000/fileArray")
        .then((res) => res.json())
        .then((fileArray) =>
          this.setState({ fileArray: fileArray, loadingModal: false })
        );
    }, 1000);
  }

  handlePullResolve = (e) => {
    e.preventDefault();
    let fileArray = this.state.fileArray;
    this.props.history.replace("./resolveConflicts", { fileArray: fileArray });
  };

  render() {
    const pulls = this.state.pulls.map((pulls) => (
      <tr key={pulls.id}>
        <td>{pulls.title}</td>
        <td>
          <span class="badge badge-pill badge-danger">
            {pulls.conflictedFiles}
          </span>
        </td>
        <td>
          <button
            className="btn btn-success btn-sm"
            onClick={this.handlePullResolve}
          >
            Resolve
          </button>
        </td>
      </tr>
    ));
    return (
      <div>
        <NavBar />
        <h4 className="bg bg-warning text-center">Pull Requests</h4>
        {this.state.loadingModal ? (
          <Barloader height={"12px"} width={"1110px"} />
        ) : (
          <FadeIn>
            <div className="container text-center">
              <table
                class="container table table-hover table-sm mt-3 mr-5"
                //style={{ width: "80%" }}
              >
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Conflicted Files</th>
                    <th scope="col">Resolve</th>
                  </tr>
                </thead>
                <tbody>{pulls}</tbody>
              </table>
            </div>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default withRouter(Pulls);
