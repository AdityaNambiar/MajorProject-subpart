/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component,useContext } from "react";
import NavBar from "./navbar";
//import Label from "./../UtilsLayout/label";
import BranchListCard from "./branchListCard";
import ThreeDotsLoader from "../loaders/threeDotsLoader";
import { withRouter } from "react-router-dom";
import "../project.css";
import CommitHistory from "./commitHistory";
import Spinner from "./../Utils/spinner";
import FadeIn from "react-fade-in";
import authServer from "../api/authServer";
import authServerFile from "../api/authServerFile"
import erroHandle from "../hooks/errorHandling"
import { url } from "../utilities/config";
import FileBrowser,{Icons} from 'react-keyed-file-browser';
import "../../node_modules/react-keyed-file-browser/react-keyed-file-browser.css"
import "../../node_modules/font-awesome/css/font-awesome.min.css";
import GreekingLoader from "../loaders/greekingLoader"
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import "../prism.css"
const downloadFile = require("../hooks/downloadCard");
const axios = require("axios")
const processFiles = require("../utilities/processFiles");


class Project extends Component {
 
  
  constructor(props){
    super(props)
    
  this.state = {
      loadingModal: false,
      url: "",
      branches: [],
      collaborators: [],
      projectFiles: [],
      labels: [],
      branch: {},
      bname: "",
      createFileEditor: "",
      newFileName: "",
      disabled: true,
      loading: false,
      bloading: false,
      dloading: false,
      commitBehind: "",
      branchOn: localStorage.getItem(this.props.location.state.projectid),
      commitMessage: " ",
      commitHash:null,
      selectedFile:null,
      pullRequests: 0,
      branchLoading:false,
      files:[],
      pullloading:true
      
    };
    
    this.onChange = this.onChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.setFiles = this.setFiles.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCreateFileBtn = this.handleCreateFileBtn.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
    this.handleProjectGraph = this.handleProjectGraph.bind(this);
    this.handlePullRequest = this.handlePullRequest.bind(this);
   
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

  handleSubmit = async (e) => {
    e.preventDefault();
    try{
    const bname = this.state.bname;
    let {projectid} = this.props.location.state;
    if (bname.trim() === "") {
      window.alert("Branch name cannot be empty!!");
    } else {
      this.setState({ bloading: true });
      let body ={
        "projectid":projectid,
        "operation":"ADDBRANCH",
        "branchToUpdate":this.state.branchOn,
        "branchName":bname,
        "commitHash":this.state.commitHash
      }
      const {data} = await authServer.post("/checkAccess",body);
      localStorage.setItem(projectid,bname)
      this.setState({bloading:false,branchOn:bname});
      window.location.reload(false)
    }
  }catch(error){
    erroHandle(error);
    this.setState({bloading:false})
  }
  };

  handleBranchList = async () => {
    this.setState({branchLoading:true})
      try{
        let body={
          "branchToUpdate":this.state.branchOn,
          "projectid":this.props.location.state.projectid,
          "operation":"GETBRANCHES"
        }
        const {data} = await axios.post(`${url}/checkAccess`,body,{
          headers:{
            'x-auth-token':localStorage.getItem("x-auth-token")
          }
        });
        this.setState({branches:data.branchlist,branchLoading:false})
    }catch(error){
      erroHandle(error);
      this.setState({branchLoading:false})
    }
  };
 
  handleProjectCollaborators = async () => {
    try{
      this.setState({ loadingModal: true });
      const {data} = await authServer.post('/getProjectsOfMember',{});
      if(data.length ==0){
       return  this.setState({ collaborators: [], loadingModal: false })
      }
      let {projectid} = this.props.location.state
      let collaborators = data.filter((proj)=>proj.projectid==projectid)[0].collaborators
        this.setState({ collaborators: collaborators, loadingModal: false })
    }catch(error){
      erroHandle(error);
      this.setState({ loadingModal: false });
    }
    
    
  };

  setFiles = (files) => {
    let labels = processFiles(files);
    return labels;
  };

  handleCreateFileBtn = async (e) => {
    e.preventDefault();
    let {newFileName,createFileEditor,commitMessage} = this.state
    if(commitMessage===""){
      return window.alert("Commit message cannot be empty");
    } 
    if (createFileEditor === "") {
      return window.alert("Contents of file cannot be empty!");
    } 
    try{
      this.setState({ cmloading: true });
      let {projectid} = this.props.location.state
      let body = {
        "projectid":projectid,
        "operation":"COMMITFILE",
        "branchToUpdate":this.state.branchOn,
        "filename":newFileName,
        "usermsg":commitMessage,
        "filebuff":createFileEditor,
        "commitHash":this.state.commitHash
      }
        const {data} = await authServer.post("/checkAccess",body);
        console.log(data);
        this.setState({ cmloading: false });
    }catch(error){
        erroHandle(error);
        this.setState({ cmloading: false });
    }
  }; 
  handleDownload = async (e) => {
    e.preventDefault();
    try{
      this.setState({ dloading: true });
      let {projectid} = this.props.location.state;
      let body = {
        "projectid":projectid,
        "branchToUpdate":this.state.branchOn,
        "operation":"DOWNLOADREPO"
      }
      let url =  `${require("../utilities/config").url}/checkAccess`    
      let token = localStorage.getItem("x-auth-token");
      const res = await axios.post(url,body, {
        responseType:"arraybuffer",
        headers: {
            "x-auth-token":token,
            "Content-Type":"application/json"
        }
    });
        downloadFile(res,`${projectid}.zip`)
        this.setState({ dloading: false });
    }catch(error){
      erroHandle(error);
      this.setState({ dloading: false });
    }
    
    
  };
  handleProjectGraph = (e) => {
    e.preventDefault();
    let pname = e.target.name;
    this.props.history.push("./projectGraph", { projectid: pname,branchOn:this.state.branchOn });
  };

  handleUploadCommit = async (e) => {
    e.preventDefault();
    const {selectedFile,commitMessage} = this.state
    if(selectedFile==null){
      return alert("Please select a file to upload.")
    }
    if (commitMessage === "") {
     return  window.alert("Commit Description cannot be blank!!");
    }
    try{
      this.setState({ cmloading: true });
      let {projectid} = this.props.location.state
      const formdata = new FormData();
      formdata.append("file",selectedFile);
      formdata.set("projectid",projectid);
      formdata.set("branchToUpdate",this.state.branchOn);
      formdata.set("filename",selectedFile.name);
      formdata.set("usermsg",commitMessage);
      formdata.set("commitHash",this.state.commitHash);
      formdata.set("operation","COMMITFILE");
     

      const {data} = await authServerFile.post("/checkAccess",formdata);
      this.setState({ cmloading: false });
      alert("File uploaded Successfully")
    }catch(error){
      erroHandle(error);
      this.setState({ cmloading: false });
    }

  };

  getPulls = async(projectid,branchOn)=>{
   try{ 
     this.setState({pullloading:true})
    let body = {
      "projectid":projectid,
      "operation":"GETMERGEOBJ",
      "branchToUpdate":branchOn, 
    } 
    
      const {data} = await axios.post(`${url}/checkAccess`,body,{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      });
      // console.log(data)
    this.setState({pullRequests:data.mainMergeObj.length,pullloading:false});
  }catch(error){
    erroHandle(error);
    this.setState({pullloading:false})

  }
  }

  async getFiles(){
    try{
      // this.setState({loadingModal:true})
      let {projectid,commitHash} = this.props.location.state;
      commitHash = localStorage.getItem(projectid)==commitHash?commitHash:undefined;
      this.setState({commitHash:commitHash,loadingModal:true})
      
      const branchToUpdate = this.state.branchOn;
      let body = {"projectid":projectid,"operation":"GETFILES","branchToUpdate":branchToUpdate,commitHash:commitHash}
      const {data} = await axios.post(`${url}/checkAccess`,body,{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      }); 
     
      // let labels = this.setFiles(data.files);
     
      this.setState({loadingModal:false,commitBehind:data.statusLine,url:data.url,files:data.files});

      try{
        document.getElementsByClassName("size")[0].innerText = "Commit Message";
        document.getElementsByClassName("modified")[0].innerText = "Timestamp";
        document.getElementsByClassName("rendered-react-keyed-file-browser")[0].nextSibling.remove();
      }catch(error){
    
      }
      this.removeB();
      this.getPulls(projectid,branchToUpdate)
    }catch(error){
      erroHandle(error);
      this.setState({loadingModal:false})
    }
  }

  handleSelectedFile = (file)=>{
    try{ 
      document.getElementsByClassName("rendered-file-browser")[0].nextSibling.style.display = "none"
     }catch(error){
  
     }
     let {projectid,access} = this.props.location.state;
     this.props.history.push("./specificFile", {
      fname: file.key,
      projectName: projectid,
      onBranch:this.state.branchOn,
      commitHash:this.state.commitHash,
      access:access
    }); 
  } 
  removeB = ()=>{
    let sizes = document.getElementsByClassName("size");
    for(let i = 1;i<sizes.length;i++){
      let msg = sizes[i].innerText;
       if(msg.slice(-2)==" B"){
          sizes[i].innerText = msg.slice(0,-1);
       }  
       
    }
  }
  handleSelectedFolder = ()=>{
      this.removeB()
  }
  async componentDidMount(){
    await this.getFiles()
    
  }
  
  checkoutBranch = (branchName)=>{ 
     
      console.log(branchName)
      let {projectid} = this.props.location.state;
      localStorage.setItem(projectid,branchName)
    // this.setState({branchOn:branchName})
    window.location.reload()
    
  }

  handlePullRequest = (e) => {
    e.preventDefault();
    let projectid = this.props.location.state.projectid
    this.props.history.push("/pulls", { projectid: projectid,branchOn:this.state.branchOn });
  };

  render() {
    let {projectid,access} = this.props.location.state;
    let pname = projectid;
    let branchOn = this.state.branchOn;
    //console.log(branchOn);

    const branchList = this.state.branches.map((branch, index) => (
      <BranchListCard
       key={index} 
       branch={branch} 
       pname={pname} 
       branchOn={branchOn} 
       commitHash={this.state.commitHash} 
       checkoutBranch={(bname)=>this.checkoutBranch(bname)}
       access={access} /> 
    ));

    const collaboratorsList = this.state.collaborators.map((collaborators) => (
     
    <React.Fragment>
    <tr>
      <th scope="row">{collaborators.employeeid}</th>
      <td>{collaborators.fname} {collaborators.lname}</td>
      <td>{collaborators.emailid}</td>
      <td>{collaborators.designation}</td>
      <td>{collaborators.contact}</td>
    </tr></React.Fragment>
    ));

    return (
      <div>
        <NavBar  projectid={projectid} access={access}/>
       
        <h5 className="bg bg-warning sticky-top text-center">
          <span className="">{`${pname}`}</span>
        </h5>
        <div className="container mt-2">
        <div className="row ml-2">
          <span className="badge badge-pill badge-info  ml-2 mt-2 mb-2 pt-2 ">
            Current branch: {branchOn}
          </span>
          <div>
            {/* Button trigger modal */}
            {access&&(<button
              type="button"
              className="btn btn-outline-secondary btn-sm m-2 ml-5"
              data-toggle="modal"
              data-target="#createBranch"
            > 
              Create Branch
            </button>)}

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
                      disabled={this.state.bloading}
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
                  <div class="modal-body bg-dark">
                  {this.state.branchLoading ? (
                      <ThreeDotsLoader height={"300px"} width={"100%"} />
                    ) : (
                      <FadeIn>
                        {branchList}
                      </FadeIn>
                    )}
                  </div>
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
                    disabled={this.state.dloading}
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

          <button
              type="button"
              name={pname}
              className="btn btn-outline-dark btn-sm ml-2 mt-2 mb-2"
              onClick={this.handlePullRequest}
            >
              Pull requests

              {
                this.state.pullloading?(
                  <i className="fa fa-spinner fa-spin"></i>
               ):(
                <span className="badge badge-pill badge-dark ml-2">
                  {this.state.pullRequests}
                </span>
               )}
            
            </button>

        </div>

        <div className="row" >
          {/* Project Tabs start*/}
          <div className="m-2 ml-4" style={{width:"1110px"}}>
            <ul class="nav nav-tabs" id="myTab" role="tablist">
              <li class="nav-item">
                <a
                  class="nav-link active "
                  id="allfiles-tab"
                  data-toggle="tab"
                  href="#allfiles"
                  role="tab"
                  aria-controls="allfiles"
                  aria-selected="true"
                  onClick={async ()=>await this.getFiles()}
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
              { access&&(
                    <>
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
                    </>
              )}
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


 

            <div class="tab-content" id="myTabContent" >
              <div
                class="tab-pane fade show active"
                id="allfiles"
                role="tabpanel"
                aria-labelledby="allfiles-tab"
              >
                {this.state.loadingModal ? (
                  <GreekingLoader height={"50vh"} width={"100%"}/>
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
                         
                         </p>
                      </div>
                      {/* <table class="table table-striped table-sm">
                        <thead>
                          <tr>
                            <th scope="col">Filename</th>
                            <th scope="col">Commit Message</th>
                            <th scope="col">Timestamp</th> 
                          </tr>
                        </thead>
                        <tbody>
                            
                        </tbody>
                      </table>  */}
                     <div>
                        <FileBrowser
                             files={this.state.files}
                             // icons={Icons.FontAwesome(4)}
                             icons={{
                               Folder: <i className="fa fa-folder" aria-hidden="true" />,
                               File:<i className="fa fa-file" aria-hidden="true" />
                             }}
                             onSelectFile={this.handleSelectedFile}
                             onSelectFolder={this.handleSelectedFolder}
                             showActionBar={false} 
                            
                            />
                    </div>

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
                  
                  <GreekingLoader height={"60vh"} width={"70%"}/>
                
                ) : (
                  <FadeIn>
                    {/*<ol className="mt-4">{collaboratorsList}</ol>*/}
                    <table class="table">
  <thead class="thead-dark mt-4">
    <tr>
      <th scope="col">Emp id</th>
      <th scope="col">Name</th>
      <th scope="col">Email-id</th>
      <th scope="col">Designation</th>
      <th scope="col">Contact</th>
    </tr>
  </thead>
  <tbody>
    {collaboratorsList}
  </tbody>
</table>
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
                        <div class="form-group ufiles">
                          <input
                            type="file" 
                            class="form-control"
                            // multiple="false"
                            onChange={(e)=>this.setState({selectedFile:e.target.files[0]})}
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
                    {/* <textarea
                      name="createFileEditor"
                      class="form-control mt-1 mb-2 bg bg-dark text-light"
                      id="exampleFormControlTextarea1"
                      rows="16"
                      placeholder="Start writing here..."
                      onChange={this.onChange}
                      value={this.state.createFileEditor}
                    ></textarea> */}

                    <Editor
                      value={this.state.createFileEditor}
                      onValueChange={createFileEditor => this.setState({ createFileEditor })}
                      highlight={createFileEditor => highlight(createFileEditor, languages.js)}
                      padding={10}
                      
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        border:"1px solid black", 
                        borderRadius:"5px",
                        // backgroundColor:"black",
                        fontSize: 12,
                        minHeight:"400px"
                       
                        
                      }}/>  
                 


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
                      type="button"
                      style={{ height: "40px " }}
                      className="btn btn-success border border-success"
                      disabled={this.state.disabled}
                      data-toggle="modal"
                      data-target="#createfile"
                      
                    >
                      Create
                    </button>
                    <div
                          class="modal fade"
                          id="createfile"
                          tabindex="-1"
                          role="dialog"
                          aria-labelledby="createfileLabel"
                          aria-hidden="true"
                        >
                          <div class="modal-dialog" role="document">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h5 class="modal-title" id="createfileLabel">
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
                                  onClick={this.handleCreateFileBtn}
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

                  </div>
                </form>
              </div>
 
              <div
                class="tab-pane fade" 
                 id="commitHistory"
                role="tabpanel"
                aria-labelledby="commitHistory-tab"
              >
              {this.state.files.length>0&&(<CommitHistory 
                  projectName={pname}
                  onBranch={branchOn}
                  commitOf="branchCommits"
                  access={access}
                />)}
              </div>
            </div>
          </div>
          {/* Project Tabs  Ends*/}
        
        </div></div>
      </div>
    ); 
  }
}

export default withRouter(Project);
