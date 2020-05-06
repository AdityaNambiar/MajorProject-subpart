/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import FadeIn from "react-fade-in";
import Spinner from "./../Utils/spinner";
import Barloader from "../loaders/barLoader";

class ResolveConflicts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadingModal: false,
      commitMessage: "",
      fileArray: this.props.location.state.fileArray,
      text: "Click on any file to edit...",
      currentFile: "",
    };
    this.onChange = this.onChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileClick = this.handleFileClick.bind(this);
    this.handleCommit = this.handleCommit.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }
  componentWillMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      this.setState({ loadingModal: false });
    }, 3000);
  }

  handleChange(value) {
    this.setState({ text: value });
  }

  handleFileClick = (e) => {
    e.preventDefault();
    let fname = e.target.name;
    let text = e.target.id;
    this.setState({ text: text, currentFile: fname });
  };

  handleCommit = (e) => {
    e.preventDefault();
    let commitMessage = this.state.commitMessage;
    if (commitMessage === "") {
      window.alert("Commit Message cannot be blank!!");
    } else {
      this.setState({ loading: true });
      setTimeout(() => {
        this.setState({ loading: false });
      }, 3000);
    }
  };

  render() {
    let fileArray = this.state.fileArray;
    const conflictedFiles = fileArray.map((fileArray, index) => (
      <tr key={index}>
        <th scope="row">{fileArray.id}</th>
        <td>
          <a
            href=""
            name={fileArray.fileName}
            id={fileArray.fileBuffer}
            onClick={this.handleFileClick}
          >
            {fileArray.fileName}
          </a>
        </td>
      </tr>
    ));

    return (
      <div>
        <NavBar />
        {this.state.loadingModal ? (
          <Barloader height={"12px"} width={"1340px"} />
        ) : (
          <FadeIn>
            <div className="row m-2">
              <div className="col-md-4">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">List of Conflicted files</th>
                    </tr>
                  </thead>
                  <tbody>{conflictedFiles}</tbody>
                </table>
                <div className="text-center">
                  <button
                    type="button"
                    class="btn btn-success btn-sm mt-4"
                    data-toggle="modal"
                    data-target="#commit"
                  >
                    Commit
                  </button>
                  <div
                    class="modal fade"
                    id="commit"
                    tabindex="-1"
                    role="dialog"
                    aria-labelledby="commitLabel"
                    aria-hidden="true"
                  >
                    <div class="modal-dialog" role="document">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h5 class="modal-title" id="commitLabel">
                            Commit Details
                          </h5>
                          <button
                            type="button"
                            class="close"
                            data-dismiss="modal"
                            aria-label="Close"
                          >
                            <span aria-hidden="true">&times;</span>
                          </button>
                        </div>
                        <div class="modal-body">
                          <form>
                            <div class="form-group">
                              <label for="formGroupExampleInput">
                                Commit Message
                              </label>
                              <input
                                type="text"
                                name="commitMessage"
                                class="form-control"
                                id="formGroupExampleInput"
                                value={this.state.commitMessage}
                                onChange={this.onChange}
                              />
                            </div>
                          </form>
                        </div>
                        <div class="modal-footer">
                          <button
                            type="button"
                            class="btn btn-success btn-sm"
                            onClick={this.handleCommit}
                          >
                            {this.state.loading && (
                              <span>
                                Committing <Spinner />
                              </span>
                            )}
                            {!this.state.loading && <span>Commit</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <h5>{this.state.currentFile}</h5>
                <ReactQuill
                  value={this.state.text}
                  onChange={this.handleChange}
                  preserveWhitespace="true"
                />
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default withRouter(ResolveConflicts);
