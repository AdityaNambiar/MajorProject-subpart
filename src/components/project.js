/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import NavBar from "./navbar";
import Label from "./../UtilsLayout/label";
import Forum from "./forum";
import BranchListCard from "./branchListCard";
import { withRouter } from "react-router-dom";
import "../project.css";
import CommitHistory from "./commitHistory";
import Spinner from "./../Utils/spinner";
import FadeIn from "react-fade-in";

const processFiles = require("../utilities/processFiles");

class Project extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loadingModal: false,
      url: "https://github.com/AdityaNambiar/testrepo1.git",
      branches: [],
      collaborators: [],
      projectFiles: [],
      labels: [],
      branch: {},
      bname: "",
      bdescription: "",
      notice: [
        {
          creator: "Gopi",
          designation: "Project Manager",
          desc: "This is message 1",
        },
        {
          creator: "Raj",
          designation: "Developer",
          desc:
            "Minim sint velit excepteur deserunt labore. Laborum velit in cupidatat sunt excepteur quis duis et eiusmod irure. Do consectetur cupidatat sunt et duis aliquip et commodo.",
        },
        {
          creator: "Aditya",
          designation: "Consultant",
          desc: "This is message 3",
        },
        { creator: "Shyam", designation: "Intern", desc: "This is message 4" },
      ],
      noticeText: "This is a notice!!!",
      createFileEditor: "",
      newFileName: "",
      disabled: true,
      requestFailed: false,
      loading: false,
      bloading: false,
      dloading: false,
      floading: false,
      commitBehind: "This branch is 3 commits behind master",
      branchOn: "master",
      commitMessage: "",
    };
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getFile = this.getFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCreateFileBtn = this.handleCreateFileBtn.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
    this.handleProjectGraph = this.handleProjectGraph.bind(this);
    this.handleMergeChanges = this.handleMergeChanges.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleChange = (e) => {
    let filename = { ...this.state.newFileName };
    filename = e.currentTarget.value;
    this.setState({ newFileName: filename });
    if (filename.length === 0) this.setState({ disabled: true });
    else this.setState({ disabled: false });
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const branch = {
      bname: this.state.bname,
    };
    if (branch.bname === "") {
      window.alert("Branch name cannot be empty!!");
    } else {
      this.setState({ bloading: true });
      fetch("http://localhost:3000/branches", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(branch),
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.status);
          else return res.json();
        })
        .then((data) => {
          this.setState({ branch: data });
          console.log("DATA STORED");
        })
        .catch((error) => {
          console.log(error);
          this.setState({ requestFailed: true });
        });
      console.log(branch);

      setTimeout(() => {
        this.setState({ bloading: false });
        window.location.reload();
      }, 3000);
    }
  };

  handleBranchList = (e) => {
    fetch("http://localhost:3000/branches")
      .then((res) => res.json())
      .then((branches) => this.setState({ branches: branches }));
  };

  handleProjectCollaborators = (e) => {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/members")
        .then((res) => res.json())
        .then((collaborators) =>
          this.setState({ collaborators: collaborators, loadingModal: false })
        );
    }, 3000);
  };

  getFile = (event) => {
    let labels = processFiles(event);
    const projectFiles = event.target.files;
    this.setState({ labels: labels, projectFiles: projectFiles });
  };

  handleCreateFileBtn = (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    let newFile = {
      newFileName: this.state.newFileName,
      newFileContent: this.state.createFileEditor,
    };
    if (newFile.newFileContent === "") {
      window.alert("Contents of file cannot be empty!");
    } else {
      fetch("http://localhost:3000/newFile", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(newFile),
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.status);
          else return res.json();
        })
        .then((data) => {
          this.setState({ newFile: data });
          console.log("DATA STORED");
        })
        .catch((error) => {
          console.log(error);
        });
      console.log(newFile);
    }

    setTimeout(() => {
      this.setState({ loading: false });
      window.location.reload();
    }, 3000);
  };
  handleDownload = (e) => {
    e.preventDefault();
    this.setState({ dloading: true });
    setTimeout(() => {
      this.setState({ dloading: false });
    }, 3000);
  };
  handleProjectGraph = (e) => {
    e.preventDefault();
    let pname = e.target.name;
    this.props.history.push("./projectGraph", { pname: pname });
  };

  handleMergeChanges = (e) => {
    e.preventDefault();
    this.props.history.push("./mergeConflict");
  };
  handleUploadCommit = (e) => {
    e.preventDefault();
    let commitMessage = this.state.commitMessage;
    if (commitMessage === "") {
      window.alert("Commit Description cannot be blank!!");
    } else {
      this.setState({ cmloading: true });
      setTimeout(() => {
        this.setState({ cmloading: false });
      }, 3000);
    }
  };
  render() {
    let propsObj = this.props.location.state;
    let pname = propsObj.pname;
    let branchOn = propsObj.branchname;
    //console.log(branchOn);

    const branchList = this.state.branches.map((branch, index) => (
      <BranchListCard key={index} branch={branch} pname={pname} />
    ));

    const collaboratorsList = this.state.collaborators.map((collaborators) => (
      <div>
        <li>
          {collaborators.fname} {collaborators.lname}
        </li>
        <br />
      </div>
    ));

    return (
      <div>
        <NavBar />
        <h5 className="bg bg-warning sticky-top ">
          <span className="m-5">All about project {`${pname}`}</span>
        </h5>

        <div className="row ml-2">
          <span className="badge badge-pill badge-info  ml-2 mt-2 mb-2 pt-2 ">
            Current branch: {branchOn}
          </span>
          <div>
            {/* Button trigger modal */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm m-2 ml-5"
              data-toggle="modal"
              data-target="#createBranch"
            >
              Create Branch
            </button>

            {/* Modal */}
            <div
              className="modal fade"
              id="createBranch"
              tabindex="-1"
              role="dialog"
              aria-labelledby="createBranchTitle"
              aria-hidden="true"
            >
              <div
                className="modal-dialog modal-dialog-centered"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="exampleModalLongTitle">
                      Enter new branch details
                    </h5>
                    <button
                      type="button"
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    {/*<form onSubmit={this.onSubmit}>*/}
                    <form>
                      <div className="form-group">
                        <label for="recipient-name" className="col-form-label">
                          Branch Name:
                        </label>
                        <input
                          type="text"
                          name="bname"
                          className="form-control"
                          id="recipient-name"
                          value={this.state.bname}
                          onChange={this.onChange}
                        />
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      onClick={this.handleSubmit}
                      //data-dismiss="modal"
                    >
                      {this.state.bloading && (
                        <small>
                          Creating Branch <Spinner />
                        </small>
                      )}
                      {!this.state.bloading && <small>Create</small>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <button
              type="button"
              class="btn btn-outline-danger btn-sm"
              data-toggle="modal"
              data-target="#branchOperations"
              onClick={this.handleBranchList}
            >
              Branch Operations
            </button>

            <div
              class="modal fade"
              id="branchOperations"
              tabindex="-1"
              role="dialog"
              aria-labelledby="branchOperationsTitle"
              aria-hidden="true"
            >
              <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                  <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="exampleModalCenterTitle">
                      Project {pname} Branches
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
                  <div class="modal-body bg-dark">{branchList}</div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-outline-success btn-sm ml-2 mt-2 mb-2"
            data-toggle="modal"
            data-target="#exampleModal"
          >
            Download
          </button>

          <div
            class="modal fade"
            id="exampleModal"
            tabindex="-1"
            role="dialog"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
          >
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h6 class="modal-title" id="exampleModalLabel">
                    Use the url to clone or download directly
                  </h6>
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
                  <input
                    class="form-control"
                    type="text"
                    value={this.state.url}
                    readonly
                  />
                </div>
                <div class="modal-footer">
                  <button
                    type="button"
                    name={pname}
                    className="btn btn-success btn-sm"
                    onClick={this.handleDownload}
                  >
                    {this.state.dloading && (
                      <span>
                        Downloading <Spinner />
                      </span>
                    )}
                    {!this.state.dloading && <span>Download</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            name={pname}
            className="btn btn-outline-warning btn-sm ml-2 mt-2 mb-2 text-dark"
            onClick={this.handleProjectGraph}
          >
            Project Graph
          </button>
        </div>

        <div className="row">
          {/* Project Tabs start*/}
          <div className="m-2 ml-4" style={{ width: "600px" }}>
            <ul class="nav nav-tabs" id="myTab" role="tablist">
              <li class="nav-item">
                <a
                  class="nav-link active "
                  id="files-tab"
                  data-toggle="tab"
                  href="#files"
                  role="tab"
                  aria-controls="files"
                  aria-selected="true"
                >
                  Files
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  id="collaborators-tab"
                  data-toggle="tab"
                  href="#collaborators"
                  role="tab"
                  aria-controls="collaborators"
                  aria-selected="false"
                  onClick={this.handleProjectCollaborators}
                >
                  Collaborators
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  id="upload-tab"
                  data-toggle="tab"
                  href="#upload"
                  role="tab"
                  aria-controls="upload"
                  aria-selected="false"
                >
                  Upload Files
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  id="createFile-tab"
                  data-toggle="tab"
                  href="#createFile"
                  role="tab"
                  aria-controls="createFile"
                  aria-selected="false"
                >
                  Create File
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  id="commitHistory-tab"
                  data-toggle="tab"
                  href="#commitHistory"
                  role="tab"
                  aria-controls="commitHistory"
                  aria-selected="false"
                >
                  Commits
                </a>
              </li>
            </ul>
            <div class="tab-content" id="myTabContent">
              <div
                class="tab-pane fade show active"
                id="files"
                role="tabpanel"
                aria-labelledby="files-tab"
              >
                {this.state.loadingModal ? (
                  <lottie-player
                    src="https://assets10.lottiefiles.com/packages/lf20_obP8oy.json"
                    background="transparent"
                    speed="1"
                    style={{ width: "615px", height: "415px" }}
                    loop
                    autoplay
                  ></lottie-player>
                ) : (
                  <FadeIn>
                    <div>
                      <div className="mx-auto">
                        <p
                          className="bg bg-light text-wrap mx-auto text-left border border-dark rounded pb-2 pt-1"
                          style={{
                            marginBottom: "0px",
                          }}
                        >
                          {this.state.commitBehind}
                          <button
                            type="button"
                            className="float-right btn btn-success btn-sm mb-1 mx-2"
                            onClick={this.handleMergeChanges}
                          >
                            Merge Changes
                          </button>
                        </p>
                      </div>
                      <table class="table table-striped table-sm">
                        <thead>
                          <tr>
                            <th scope="col">Filename</th>
                            <th scope="col">Commit Message</th>
                            <th scope="col">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.labels.map((label) => (
                            <Label
                              onChange={this.getFile}
                              key={label.id}
                              labelobj={label}
                              projectName={pname}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </FadeIn>
                )}
              </div>
              <div
                class="tab-pane fade"
                id="collaborators"
                role="tabpanel"
                aria-labelledby="collaborators-tab"
              >
                {this.state.loadingModal ? (
                  <lottie-player
                    src="https://assets10.lottiefiles.com/packages/lf20_obP8oy.json"
                    background="transparent"
                    speed="1"
                    style={{ width: "615px", height: "415px" }}
                    loop
                    autoplay
                  ></lottie-player>
                ) : (
                  <FadeIn>
                    <ol className="mt-4">{collaboratorsList}</ol>
                  </FadeIn>
                )}
              </div>
              <div
                class="tab-pane fade"
                id="upload"
                role="tabpanel"
                aria-labelledby="upload-tab"
              >
                <div class="container">
                  <div class="row">
                    <div class="col-md-12 mt-4">
                      <form method="post" action="#" id="#">
                        <div class="form-group files">
                          <input
                            type="file"
                            class="form-control"
                            // multiple="false"
                            onChange={this.getFile}
                          />
                        </div>
                        <button
                          type="button"
                          class="float-right btn btn-primary btn-sm"
                          data-toggle="modal"
                          data-target="#commit"
                        >
                          Upload
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
                                  onClick={this.handleUploadCommit}
                                >
                                  {this.state.cmloading && (
                                    <span>
                                      Committing <Spinner />
                                    </span>
                                  )}
                                  {!this.state.cmloading && <span>Commit</span>}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="tab-pane fade"
                id="createFile"
                role="tabpanel"
                aria-labelledby="createFile-tab"
              >
                <form>
                  <div class="form-group" style={{ width: "620px" }}>
                    <textarea
                      name="createFileEditor"
                      class="form-control mt-1 mb-2 bg bg-dark text-light"
                      id="exampleFormControlTextarea1"
                      rows="16"
                      placeholder="Start writing here..."
                      onChange={this.onChange}
                      value={this.state.createFileEditor}
                    ></textarea>
                  </div>
                  <div className="row" style={{ width: "620px" }}>
                    <div class="form-group col-sm-8 ml-5">
                      <input
                        name="newFileName"
                        type="text"
                        class="form-control border border-dark"
                        placeholder="File name with extension"
                        onChange={this.handleChange}
                        value={this.state.newFileName}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ height: "40px " }}
                      className="btn btn-success border border-success"
                      onClick={this.handleCreateFileBtn}
                      disabled={this.state.disabled}
                    >
                      {this.state.loading && (
                        <small>
                          Creating File <Spinner />
                        </small>
                      )}
                      {!this.state.loading && <small>Create</small>}
                    </button>
                  </div>
                </form>
              </div>

              <div
                class="tab-pane fade"
                id="commitHistory"
                role="tabpanel"
                aria-labelledby="commitHistory-tab"
              >
                <CommitHistory pname={pname} />
              </div>
            </div>
          </div>
          {/* Project Tabs  Ends*/}
          <Forum />
        </div>
      </div>
    );
  }
}

export default withRouter(Project);
