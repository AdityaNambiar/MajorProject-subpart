/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component } from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import Spinner from "./../Utils/spinner";
import FadeIn from "react-fade-in";
import "./../Loading.css";
import RenderMembers from "../Utils/RenderMembers";
import BarLoader from "../loaders/barLoader"
const erroHandle = require("../hooks/errorHandling")
const jwt = require("jsonwebtoken");
const authServer = require("../api/authServer")

const axios =require("axios");
const {url} = require("../utilities/config")
class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username:"",
      loadingModal: false,

      loading: false,
      cloading: false,
      delLoading: false,
      dataDismiss: "",
      members: [],
      projects: [],
      project: {},
      projectid: "",
      description: "",
      private: true,
      pmanager: "Gopi",
      collaborators:{},
      projectBranch:{}
    };
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleProject = this.handleProject.bind(this);
    this.handleCollaboratorAdd = this.handleCollaboratorAdd.bind(this);
    this.handleAddCollabSaveBtn = this.handleAddCollabSaveBtn.bind(this);
    this.handleClientChat = this.handleClientChat.bind(this);
  }
  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  //Create Project
  handleSubmit = async(e) => {
    e.preventDefault();
    
    const project = {
      projectid: this.state.projectid,
      description: this.state.description,
      private: this.state.private,
    };
    this.setState({ loading: true });
    try{
      await axios.post(`${url}/createProject`,project,{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      });
      this.setState({loading:false,dataDismiss: "modal"})
      window.location.reload(true);
    }catch(error){
      erroHandle(error)
      this.setState({loading:false,dataDismiss: "modal"})
      window.location.reload(true);
    }
  };
  
  //fetch projects
  async componentDidMount() {
    this.setState({ loadingModal: true });
    try{

      let config = {
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      }
      const {data} = await axios.post(`${url}/getProjectsOfMember`,{},config);
     const response = await axios.post(`${url}/getParticipants`,{},config);
      
      const members = [];
      let membersarr = response.data.Member;
      let managersarr = response.data.ProjectManager;
      let {cardName} = jwt.decode(localStorage.getItem('x-auth-token'));
      let username = cardName.split('@devopschain')[0]
      if(membersarr!==undefined){
        members.push(...membersarr.filter(collab=>collab.pIdentifier!==username));
      }
      if(managersarr!==undefined){
          // console.log(managersarr)
         members.push(...managersarr.filter(collab=>collab.pIdentifier!==username))
        
      }
        let collaborators = {};
        let projectBranch ={}
        data.map((project)=>{
          collaborators[project.projectid] = project.collaborators;
          projectBranch[project.projectid] = "master"
        })
  
      this.setState({loadingModal:false,projects:data,members:members,collaborators:collaborators,username:username,projectBranch:projectBranch})
    }catch(error){
        erroHandle(error)
    }
   
  }

  handleAddCollabSaveBtn = async (e,projectid) => {
    e.preventDefault();
    this.setState({cloading:true})
    const collaborators = this.state.collaborators[projectid];
    const project = this.state.projects.filter((pobj)=>pobj.projectid==projectid)[0];
    project.collaborators = collaborators
    try{
      const {data} = await axios.post(`${url}/updateProject`,project,{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      })
      this.setState({cloading:false})
      // window.location.reload();
    }catch(error){
      this.setState({cloading:false})
      erroHandle(error)
    }
   
  };

  handleDelete = async (e,projectid) => {
    e.preventDefault();
    
    this.setState({ delLoading: true });
    try{
      await axios.post(`${url}/checkAccess`,{projectid:projectid,operation:"DELETEPROJ"},{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      });

      //delete project variables
      localStorage.removeItem(projectid)
      this.setState({ delLoading: false });
      window.location.reload();
    }catch(error){
      this.setState({ delLoading: false });
        erroHandle(error)
    }
     
  };

  //handler radio button
  handleOptionChange = (changeEvent) => {
    let name = changeEvent.target.name;
    let value = changeEvent.target.value;
    let status = value=="public"?false:true
    this.setState({ [name]: status });
  };

  changeBranch = (projectid,bname)=>{
    let projectBranch = this.state.projectBranch;
    projectBranch[projectid] = bname;
    this.setState({projectBranch:projectBranch})
  }
 
  handleProject = (e) => {
    e.preventDefault();
    let projectid = e.target.name;
    // let branch = this.state.projectBranch[projectid]
    localStorage.setItem(projectid,"master");
    this.props.history.push("./project", { projectid: projectid,access:true});
  };

 //Add Collaborator
 handleCollaboratorAdd =(projectid,member)=>{
  const collaborators = this.state.collaborators;
   collaborators[projectid].push(member);
    this.setState({collaborators:collaborators})
    
 }
 //Remove Collaborator
 handleCollaboratorRemove = (projectid,member)=>{
  
   const collaborators = this.state.collaborators;
  const removed =  collaborators[projectid].filter((collab)=>collab.pIdentifier!==member.pIdentifier);
  collaborators[projectid] = removed;
  this.setState({"collaborators":collaborators});
 }

 handleClientChat = (e) => {
  e.preventDefault();
  this.props.history.push("./clientDashboard");
};
isDisabled=  {
  color: "currentColor",
  cursor: "not-allowed",
  opacity: 0.5,
  textDecoration: "none",
}
  render() {
   
    const projectDetails = this.state.projects.map((project) => (
      <React.Fragment>
        <tr>
          <td>
            <a href="#" onClick={this.handleProject} name={project.projectid}>
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
                        value={project.projectid}
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
                        value={project.description}
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
                          value={false}
                          checked={project.private==false}
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
                          value={true}
                          disabled
                          checked={project.private==true}
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
                    // onClick={this.handleAdd}
                    data-target={`#c${project.projectid}`}
                    style={project.creator.split("#")[1]==this.state.username?null:this.isDisabled}
                  >
                    Add
                  </a>
                </td>
      {project.creator.split("#")[1]==this.state.username&&(
          <div
            
            className="modal fade"
            id={`c${project.projectid}`}
            tabIndex="-1"
            role="dialog"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header bg bg-danger text-light">
                  <h5 className="modal-title" id="exampleModalLabel">
                    Add Collaborators for project {`"${project.projectid}"`}
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

                <RenderMembers 
                  members={this.state.members}
                  collaborators={this.state.collaborators[project.projectid]}
                  projectid={project.projectid}
                  addCollaborator={(id,member)=>this.handleCollaboratorAdd(id,member)}
                  removeCollaborator={(id,member)=>this.handleCollaboratorRemove(id,member)}
                />

                </div>

                <div className="text-center mb-4">
                  <button
                    type="button"
                    className="btn btn-primary"
                    //data-dismiss="modal"
                    name={project.projectid}
                    onClick={(e)=>this.handleAddCollabSaveBtn(e,project.projectid)}
                    disabled={this.state.cloading}
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
          </div>)}



          <td>
            <a href="#" data-toggle="modal" data-target={`#d${project.projectid}`}
            style={project.creator.split("#")[1]==this.state.username?null:this.isDisabled}
            >
              Delete
            </a>
          </td>
       {project.creator.split("#")[1]==this.state.username&&( <div
            className="modal fade"
            id={`d${project.projectid}`}
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
                    <mark className="bg bg-light">{`"${project.projectid}"`}</mark>?
                  </div>
                </div>
                <div className="text-center mb-4">
                  <button
                    type="button"
                    className="btn btn-danger px-4 mx-2 "
                    //data-dismiss="modal"
                    onClick={(e)=>this.handleDelete(e,project.projectid)}
                    disabled={this.state.delLoading}
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
                    disabled={this.state.delLoading}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>)}
          <td>
            <span name={project.datetime}>{project.datetime}</span>
          </td>
        </tr>
      </React.Fragment>
    ));

    return (
      <div>
        <div>
          <NavBar />
        </div>
        <div className="container">
        {this.state.loadingModal ? (
         <BarLoader height="12px" />
        ) : (
          <FadeIn>
            
              <div>
      {/* -------------------------Button redirecting  to client dashboard----------------------------- */}
              {jwt.decode(localStorage.getItem("x-auth-token")).pType=="ProjectManager"&&( 
              <button
                  className="btn btn-warning btn-sm mr-2 mt-2"
                  onClick={this.handleClientChat}
                >
                  Client Dashboard
                </button>
)}
                {/* Button trigger modal */}
                <button
                  type="button"
                  className="btn btn-primary btn-sm m-2 mt-3"
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
                              name="projectid"
                              className="form-control"
                              id="recipient-name"
                              value={this.state.projectid}
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
                              name="description"
                              value={this.state.description}
                              onChange={this.onChange}
                            ></textarea>
                          </div>
                          <div className="form-group">
                            <label
                              htmlFor="private"
                              className=" col-form-label text-md-right pr-4"
                            >
                              Status:
                            </label>
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="private"
                                id="public"
                                value="public"
                                checked={this.state.private==false}
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
                                name="private"
                                id="private"
                                value="private"
                                checked={this.state.private==true}
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
                          disabled={this.state.loading}
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
              <div className="table-responsive-sm m-2">
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
           
          </FadeIn>
        )}</div>
      </div>
    );
  }
}

export default withRouter(Dashboard);
