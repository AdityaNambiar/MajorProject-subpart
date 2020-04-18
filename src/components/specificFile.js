/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import NavBar from "./navbar";
import CommitHistory from "./commitHistory";
import Spinner from "./../Utils/spinner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import FadeIn from "react-fade-in";

class SpecificFile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadingModal: false,
      commitMessage: "",
      specificFileEditor:
        "Lorem dolore mollit \n ad veniam commodo nulla dolor amet.\n Nisi ex excepteur culpa occaecat ipsum enim mollit \n sit. Non deserunt ad pariatur et aliquip incididunt.",
    };
    this.onChange = this.onChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    //this.handleEditButton = this.handleEditButton.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }
  handleChange(value) {
    this.setState({ specificFileEditor: value });
  }

  handleBCProjectName = (e) => {
    e.preventDefault();
    let pname = e.target.name;
    this.props.history.push("./project", { pname: pname });
  };

  componentWillMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      this.setState({ loadingModal: false });
    }, 3000);
  }
  // handleEditButton = (e) => {
  //   e.preventDefault();
  //   let disabled = this.state.disabledEditor;
  //   if (disabled === false) {
  //     this.setState({ disabledEditor: true });
  //   } else {
  //     this.setState({ disabledEditor: false });
  //   }
  // };

  handleSaveButton = (e) => {
    e.preventDefault();
    let commitMessage = this.state.commitMessage;
    if (commitMessage === "") {
      window.alert("Commit Description cannot be blank!!");
    } else {
      this.setState({ loading: true });
      setTimeout(() => {
        this.setState({ loading: false });
      }, 3000);
    }
  };
  render() {
    let propsObj = this.props.location.state;
    let fname = propsObj.fname;
    let pname = propsObj.projectName;
    return (
      <div className="">
        <NavBar />

        {this.state.loadingModal ? (
          <lottie-player
            src="https://assets3.lottiefiles.com/packages/lf20_rWaqBk.json"
            background="transparent"
            speed="1"
            style={{ width: "1340px", height: "12px" }}
            loop
            autoplay
          ></lottie-player>
        ) : (
          <FadeIn>
            <div className="container">
              <nav aria-label="breadcrumb" className="mx-4 mb-2 mt-4">
                <ol class="breadcrumb">
                  <li class="breadcrumb-item">
                    <h5 className="text-dark">username</h5>
                  </li>
                  <li class="breadcrumb-item">
                    <a href="#" onClick={this.handleBCProjectName} name={pname}>
                      {pname}
                    </a>
                  </li>
                  <li class="breadcrumb-item active" aria-current="page">
                    {fname}
                  </li>
                </ol>
              </nav>
              <div className=" mb-2" style={{ width: "1111px" }}>
                <button
                  type="button"
                  class="float-right btn btn-primary mt-2 mb-2 mr-5 btn-sm"
                  data-toggle="modal"
                  data-target="#fileCommitHistory"
                >
                  History
                </button>

                <div
                  class="modal fade"
                  id="fileCommitHistory"
                  tabindex="-1"
                  role="dialog"
                  aria-labelledby="fileCommitHistoryTitle"
                  aria-hidden="true"
                >
                  <div
                    class="modal-dialog modal-dialog-centered"
                    role="document"
                  >
                    <div class="modal-content">
                      <div class="modal-header bg bg-danger text-light">
                        <h5 class="modal-title" id="exampleModalCenterTitle">
                          Commit history of {fname}
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
                        <CommitHistory commitOf={"fileCommit"} />
                      </div>
                    </div>
                  </div>
                </div>
                {/*<button
              className="btn btn-dark  mb-2 mr-2 btn-sm"
              onClick={this.handleEditButton}
            >
              Edit
            </button> */}
                <button
                  type="button"
                  class="float-right btn btn-success mt-2 mb-2 mr-2 btn-sm"
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
                          onClick={this.handleSaveButton}
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
              <div className="mt-1 mx-4 mr-4 bg bg-light">
                <ReactQuill
                  name="specificFileEditor"
                  value={this.state.specificFileEditor}
                  onChange={this.handleChange}
                  preserveWhitespace="true"
                  //disabled={this.state.disabledEditor}
                />
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default withRouter(SpecificFile);
