/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import NavBar from "./navbar";
import FadeIn from "react-fade-in";
import errorHandle from "../hooks/errorHandling";
import {url} from "../utilities/config";
import axios from "axios";
import jwt from "jsonwebtoken"
import BarLoader from "../loaders/barLoader"
import checkAccess from "../hooks/checkAccess";
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

 async componentDidMount() { 
  try{ 
    this.setState({ loadingModal: true });
    const {data} = await axios.post(`${url}/getAllProjects`,{},{
      headers:{
        'x-auth-token':localStorage.getItem("x-auth-token")
      }
    })
    this.setState({ projects: data, loadingModal: false });
  }catch(error){
   errorHandle(error);
   
  }
  }

  handleProject = (e,project) => {
    e.preventDefault(); 
    localStorage.setItem(project.projectid,"master");
    try{
    let pIdentifier = jwt.decode(localStorage.getItem("x-auth-token")).pIdentifier;
    let access = checkAccess(project,pIdentifier)
    this.props.history.push("./project", { projectid: project.projectid,access })
    }catch(error){
      alert(error)
    }
  };
 
  render() {
    const publicProjects = this.state.projects.map((project) => (
      <React.Fragment>
        <tr>
          <td>
            <a href="#" onClick={(e)=>this.handleProject(e,project)}>
              {project.projectid}
            </a>
          </td>
          <td>
            <a href="#" data-toggle="modal" data-target={`#p${project.projectid}`}>
              {" "}
              Project Details
            </a>
          </td>
          <div
            className="modal fade"
            id={`p${project.projectid}`}
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
                        value={project.projectid}
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
                        value={project.description}
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
                          checked={project.private==false}
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
                          checked={project.private ==true}
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
          <td>{project.creator.split("#").splice(-1)[0]}</td>
          <td>{project.datetime}</td>
        </tr>
      </React.Fragment>
    ));

    return (
      <div>
        <NavBar />
        <h4 className="bg bg-warning text-center">Public Projects</h4>
        {this.state.loadingModal ? (
         <BarLoader height="12px" />
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
