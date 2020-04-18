/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import Spinner from "./../Utils/spinner";
import FadeIn from "react-fade-in";
import "./../Loading.css";

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingModal: false,

      loading: false,
      cloading: false,
      delLoading: false,
      dataDismiss: "",
      members: [],
      member: {},
      projects: [],
      project: {},
      pname: "",
      pdescription: "",
      pstatus: "",
      pmanager: "Gopi",
      collabStatus: "Add",
      collaborators: [],
      collaboratorExists: false,
    };
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleProject = this.handleProject.bind(this);
    this.handleCollaboratorButton = this.handleCollaboratorButton.bind(this);
    this.handleAddCollabSaveBtn = this.handleAddCollabSaveBtn.bind(this);
  }
  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  //Create Project
  handleSubmit = (e) => {
    e.preventDefault();
    let currentDate = new Date();
    let date = currentDate.getDate();
    let month = currentDate.getMonth();
    let year = currentDate.getFullYear();
    let h = currentDate.getHours();
    let m = currentDate.getMinutes();
    let s = currentDate.getSeconds();
    let timestamp =
      date +
      "/" +
      (month + 1) +
      "/" +
      year +
      " - " +
      h +
      ":" +
      m +
      ":" +
      s +
      " IST";

    const project = {
      pname: this.state.pname,
      pdescription: this.state.pdescription,
      pstatus: this.state.pstatus,
      pmanager: this.state.pmanager,
      ptimestamp: timestamp,
    };
    fetch("http://localhost:3000/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(project),
    })
      .then((res) => res.json())
      .then((data) => this.setState({ project: data }));
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({ loading: false, dataDismiss: "modal" });
      window.location.reload(true);
    }, 3000);
  };

  //fetch projects
  componentWillMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/projects")
        .then((res) => res.json())
        .then((projects) =>
          this.setState({ projects: projects, loadingModal: false })
        );
    }, 3000);
  }

  handleAdd = (e) => {
    fetch("http://localhost:3000/members")
      .then((res) => res.json())
      .then((members) => this.setState({ members: members }));
  };

  handleAddCollabSaveBtn = (e) => {
    e.preventDefault();
    this.setState({ cloading: true });
    let collaborators = {
      pname: e.target.name,
      collaborators: this.state.collaborators,
    };
    fetch("http://localhost:3000/projectCollaborators", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(collaborators),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        else return res.json();
      })
      .then((data) => {
        this.setState({ projectCollaborators: data });
        console.log("DATA STORED");
      })
      .catch((error) => {
        console.log(error);
      });
    console.log(collaborators);
    setTimeout(() => {
      this.setState({ cloading: false });
      window.location.reload();
    }, 3000);
  };

  handleDelete = (e) => {
    e.preventDefault();
    this.setState({ delLoading: true });
    setTimeout(() => {
      this.setState({ delLoading: false });
      window.location.reload();
    }, 3000);
  };

  //handler radio button
  handleOptionChange = (changeEvent) => {
    let name = changeEvent.target.name;
    let value = changeEvent.target.value;
    this.setState({ [name]: value });
  };

  handleProject = (e) => {
    e.preventDefault();
    let pname = e.target.name;
    this.props.history.push("./project", { pname: pname });
  };

  handleCollaboratorButton = (e) => {
    e.preventDefault();
    let employeeId = e.target.name;
    let collaborators = this.state.collaborators;
    let collaboratorExists = this.state.collaboratorExists;
    console.log(employeeId);
    for (let i = 0; i < collaborators.length; i++) {
      if (employeeId === collaborators[i]) {
        console.log("exists");
        this.setState({ collaboratorExists: true });
      }
    }
    if (collaboratorExists === false) {
      this.setState({
        collaborators: this.state.collaborators.concat([employeeId]),
      });
    }
  };

  handleCollaboratorRemoveButton = (e) => {
    e.preventDefault();
    let collaborators = { ...this.state.collaborators };
    console.log(collaborators);
    let employeeId = e.target.name;
    console.log(employeeId);
  };

  render() {
    const collaborators = this.state.members.map((member, index) => (
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <div className="input-group-text">
            <button
              type="submit"
              className="btn btn-danger"
              name={member.eid}
              onClick={this.handleCollaboratorButton}
            >
              Add
            </button>
            <button
              type="submit"
              className="btn btn-warning ml-2"
              name={member.eid}
              onClick={this.handleCollaboratorRemoveButton}
            >
              Remove
            </button>
          </div>
        </div>
        <li
          type="text"
          className="form-control"
          aria-label="Text input with checkbox"
        >
          {member.fname} {member.lname} - {member.designation}
        </li>
      </div>
    ));

    const projectDetails = this.state.projects.map((project) => (
      <React.Fragment>
        <tr>
          <td>
            <a href="#" onClick={this.handleProject} name={project.pname}>
              {project.pname}
            </a>
          </td>
          <td>
            <a href="#" data-toggle="modal" data-target={`#p${project.id}`}>
              {" "}
              Project Details
            </a>
          </td>
          <div
            className="modal fade"
            id={`p${project.id}`}
            tabIndex="-1"
            role="dialog"
            aria-labelledby="exampleModalCenterTitle"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header bg bg-dark text-light">
                  <h5 className="modal-title " id="exampleModalLongTitle">
                    Project Details
                  </h5>
                  <button
                    type="button"
                    className="close text-light"
                    data-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="form-group">
                      <label
                        htmlFor="recipient-name"
                        className="col-form-label"
                      >
                        Project Name:
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="recipient-name"
                        value={project.pname}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="message-text" className="col-form-label">
                        Description:
                      </label>
                      <textarea
                        className="form-control"
                        id="message-text"
                        value={project.pdescription}
                        readOnly
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label
                        htmlFor="status"
                        className=" col-form-label text-md-right pr-4"
                      >
                        Status:
                      </label>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="status"
                          id="public"
                          value="public"
                          checked={project.pstatus === "public"}
                          disabled
                        />
                        <label className="form-check-label" htmlFor="public">
                          Public
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="status"
                          id="private"
                          value="private"
                          disabled
                          checked={project.pstatus === "private"}
                        />
                        <label className="form-check-label" htmlFor="private">
                          Private
                        </label>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <td>
            <a
              href="#"
              data-toggle="modal"
              onClick={this.handleAdd}
              data-target={`#c${project.id}`}
            >
              Add
            </a>
          </td>
          <div
            className="modal fade"
            id={`c${project.id}`}
            tabIndex="-1"
            role="dialog"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header bg bg-danger text-light">
                  <h5 className="modal-title" id="exampleModalLabel">
                    Add Collaborators for project {`"${project.pname}"`}
                  </h5>
                  <button
                    type="button"
                    className="close text-light"
                    data-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">{collaborators}</div>

                <div className="text-center mb-4">
                  <button
                    type="button"
                    className="btn btn-primary"
                    //data-dismiss="modal"
                    name={project.pname}
                    onClick={this.handleAddCollabSaveBtn}
                  >
                    {this.state.cloading && (
                      <small>
                        Saving <Spinner />
                      </small>
                    )}
                    {!this.state.cloading && <small>Save</small>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <td>
            <a href="#" data-toggle="modal" data-target={`#d${project.id}`}>
              Delete
            </a>
          </td>
          <div
            className="modal fade"
            id={`d${project.id}`}
            tabIndex="-1"
            role="dialog"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header bg bg-warning">
                  <h5 className="modal-title" id="exampleModalLabel">
                    Irreversible operation
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
                <div className="modal-body  text-center">
                  <div>
                    Are you sure you want to delete project{" "}
                    <mark className="bg bg-light">{`"${project.pname}"`}</mark>?
                  </div>
                </div>
                <div className="text-center mb-4">
                  <button
                    type="button"
                    className="btn btn-danger px-4 mx-2 "
                    //data-dismiss="modal"
                    onClick={this.handleDelete}
                  >
                    {this.state.delLoading && (
                      <small>
                        Deleting Project <Spinner />
                      </small>
                    )}
                    {!this.state.delLoading && <small>Yes</small>}
                  </button>
                  <button
                    type="button"
                    className="btn btn-success px-4 mx-2"
                    data-dismiss="modal"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
          <td>
            <span name={project.ptimestamp}>{project.ptimestamp}</span>
          </td>
        </tr>
      </React.Fragment>
    ));

    return (
      <div>
        <div>
          <NavBar />
        </div>
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
              <div>
                {/* Button trigger modal */}
                <button
                  type="button"
                  className="btn btn-primary btn-sm m-2 float-right"
                  data-toggle="modal"
                  data-target="#exampleModalCenter"
                >
                  Create Project
                </button>

                {/* Modal */}
                <div
                  className="modal fade"
                  id="exampleModalCenter"
                  tabIndex="-1"
                  role="dialog"
                  aria-labelledby="exampleModalCenterTitle"
                  aria-hidden="true"
                >
                  <div
                    className="modal-dialog modal-dialog-centered"
                    role="document"
                  >
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title" id="exampleModalLongTitle">
                          Enter Project Details
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
                            <label
                              htmlFor="recipient-name"
                              className="col-form-label"
                            >
                              Project Name:
                            </label>
                            <input
                              type="text"
                              name="pname"
                              className="form-control"
                              id="recipient-name"
                              value={this.state.pname}
                              onChange={this.onChange}
                            />
                          </div>
                          <div className="form-group">
                            <label
                              htmlFor="message-text"
                              className="col-form-label"
                            >
                              Description:
                            </label>
                            <textarea
                              className="form-control"
                              id="message-text"
                              name="pdescription"
                              value={this.state.pdescription}
                              onChange={this.onChange}
                            ></textarea>
                          </div>
                          <div className="form-group">
                            <label
                              htmlFor="pstatus"
                              className=" col-form-label text-md-right pr-4"
                            >
                              Status:
                            </label>
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="pstatus"
                                id="public"
                                value="public"
                                checked={this.state.pstatus === "public"}
                                onChange={this.handleOptionChange}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="public"
                              >
                                Public
                              </label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="pstatus"
                                id="private"
                                value="private"
                                checked={this.state.pstatus === "private"}
                                onChange={this.handleOptionChange}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="private"
                              >
                                Private
                              </label>
                            </div>
                          </div>
                        </form>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          onClick={this.handleSubmit}
                          data-dismiss={this.state.dataDismiss}
                        >
                          {this.state.loading && (
                            <small>
                              Creating Project <Spinner />
                            </small>
                          )}
                          {!this.state.loading && <small>Create</small>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="table-responsive-sm m-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Project Name</th>
                      <th scope="col">Project Details</th>
                      <th scope="col">+ Collaborator</th>
                      <th scope="col"> Remove project</th>
                      <th scope="col"> Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>{projectDetails}</tbody>
                </table>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default withRouter(Dashboard);
