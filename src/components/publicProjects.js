/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import NavBar from "./navbar";
import FadeIn from "react-fade-in";

class PublicProjects extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      project: {},
      loadingModal: false,
    };

    this.handleProject = this.handleProject.bind(this);
  }

  componentWillMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/projects")
        .then((res) => res.json())
        .then((projects) => {
          let publicProjects = [];
          for (let i = 0; i < projects.length; i++) {
            if (projects[i].pstatus === "public") {
              //this.setState({ projects: projects });
              publicProjects.push(projects[i]);
            }
          }
          this.setState({ projects: publicProjects, loadingModal: false });
        });
    }, 5000);
  }

  handleProject = (e) => {
    e.preventDefault();
    let pname = e.target.name;
    this.props.history.push("./project", { pname: pname });
  };

  render() {
    const publicProjects = this.state.projects.map((project) => (
      <React.Fragment>
        <tr>
          <td>
            <a href="#" onClick={this.handleProject} name={`${project.pname}`}>
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
            tabindex="-1"
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
                      <label for="recipient-name" className="col-form-label">
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
                      <label for="message-text" className="col-form-label">
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
                        for="status"
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
                        <label className="form-check-label" for="public">
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
                        <label className="form-check-label" for="private">
                          Private
                        </label>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <td>{project.pmanager}</td>
          <td>{project.ptimestamp}</td>
        </tr>
      </React.Fragment>
    ));

    return (
      <div>
        <NavBar />
        <h4 className="bg bg-warning text-center">Public Projects</h4>
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
              <div
                className="table-responsive-sm table-striped m-4"
                //style={{ width: "500px" }}
              >
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Project Name</th>
                      <th scope="col">Project Details</th>
                      <th scope="col">Project Manager</th>
                      <th scope="col">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>{publicProjects}</tbody>
                </table>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default PublicProjects;
