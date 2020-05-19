/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import NavBar from "./navbar";
import CommitHistory from "./commitHistory";
import Spinner from "./../Utils/spinner";
import "react-quill/dist/quill.snow.css";
import FadeIn from "react-fade-in";
import bufferToString from "../utilities/bufferToString";
import BarLoader from "../loaders/barLoader"
import axios from "axios";
import {url} from "../utilities/config"
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import "../prism.css"
const errorHandle   = require("../hooks/errorHandling");

const authServer = require("../api/authServer");

class SpecificFile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadingModal: false,
      commitMessage: "",
      specificFileEditor:"",
      showCommitModal:false,
      edit:true
      
    };
    this.onChange = this.onChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    //this.handleEditButton = this.handleEditButton.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }
  handleChange(editor) {
    // const value = editor.getText();
    this.setState({ specificFileEditor: editor });
  }

  handleBCProjectName = (e) => {
    e.preventDefault(); 
    let pname = e.target.name;
    let access = this.props.location.state.access
    this.props.history.replace("./project", { projectid: pname,access });
  };

  componentDidMount = async ()=> {
    
    try{
      const {fname,projectName,onBranch} = this.props.location.state;
      console.log(this.props.location.state)
      this.setState({ loadingModal: true });
      let body = {"operation":"READFILE","branchToUpdate":onBranch,"projectid":projectName,"filename":fname}
      const {data} = await axios.post(`${url}/checkAccess`,body,{
        headers:{
          'x-auth-token':localStorage.getItem("x-auth-token")
        }
      });
     
      let filecontent = bufferToString(data.buffer.data);
      this.setState({ loadingModal: false,specificFileEditor:filecontent });
     
    }catch(error){
      errorHandle(error);
      this.setState({ loadingModal: false });
    }
  }
  

arrrayBufferToBase64(buffer){
    let binary = "";
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength; 
    for(let i=0;i<len;i++){
      binary += String.fromCharCode(bytes[i]);

    }
    return window.btoa(binary);
  }
  handleSaveButton = async (e) => {
    e.preventDefault();
    try{
    const {specificFileEditor,commitMessage} = this.state;
    const {fname} = this.props.location.state;
    const filename = fname
    if (commitMessage === "") {
      window.alert("Commit Description cannot be blank!!");
    } else {
      this.setState({ loading: true });
      let body ={
        "projectid":this.props.location.state.projectName,
        "operation":"COMMITFILE",
        "branchToUpdate": this.props.location.state.onBranch,
        "filename":filename,
        "filebuff":specificFileEditor,
        "usermsg":commitMessage,
        "commitHash":this.props.location.state.commitHash
      }
      const {data} = await axios.post(`${url}/checkAccess`,body,{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      });
      // console.log(data);
      this.setState({ loading: false });
      window.location.reload()
    }}catch(error){
      errorHandle(error);
      this.setState({ loading: false });
      window.location.reload(false)
    }
  };
  handleEdit = ()=>{
 
    let edit  = this.state.edit;
    this.setState({edit:!edit})
  }
  render() {
    let {fname,projectName,onBranch,access} = this.props.location.state;
    return (
      <div>
        <NavBar />
        <div className="container">
        {this.state.loadingModal ? (
         <BarLoader height="12px" />
        ) : (
          <FadeIn>
            
              <nav aria-label="breadcrumb" className="mx-4 mb-2 mt-4">
                <ol class="breadcrumb">
                  {/* <li class="breadcrumb-item">
                    <h5 className="text-dark">username</h5>
                  </li> */}
                  <li class="breadcrumb-item">
                    <a href="#" onClick={this.handleBCProjectName} name={projectName}>
                      {projectName}
                    </a>
                  </li>
                  <li class="breadcrumb-item active" aria-current="page">
                    {fname}
                  </li>
                </ol>
              </nav>
              <div className=" mb-2 " id="specificFileBtns" style={{ width: "1111px" }}>
                <button
                  type="button"
                  class="btn btn-primary mt-2 mb-2 mr-2 btn-sm"
                  data-toggle="modal"
                  data-target="#fileCommitHistory"
                  onClick={()=>this.setState({showCommitModal:true})}
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
                    class="modal-dialog modal-lg modal-dialog-centered"
                    role="document"
                    style={{textAlign: "left"}}
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
                       {this.state.showCommitModal&&(<CommitHistory 
                          projectName={projectName}
                          onBranch={onBranch}
                          filename={fname}
                          commitOf="fileCommits"
                          access ={access}

                        />)}
                      </div>
                    </div>
                  </div>
                </div>
             
             {access&&(
             <>
             <button
                  type="button"
                  className=" btn btn-danger mt-2 mb-2 mr-2 btn-sm"
                  onClick={()=>this.handleEdit()}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className=" btn btn-success mt-2 mb-2 mr-5 btn-sm"
                  data-toggle="modal"
                  data-target="#commit"
                >
                  Commit
                </button>
                  </>
                )}
                <div
                  class="modal fade"
                  id="commit"
                  tabindex="-1"
                  role="dialog"
                  aria-labelledby="commitLabel"
                  aria-hidden="true"
                >
                  <div class="modal-dialog" role="document" style={{textAlign: "left"}}>
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
                          disabled={this.state.loading}
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
              <div className="mt-1 mx-4 mr-4 mb-2">
                    <Editor
                      value={this.state.specificFileEditor}
                      onValueChange={specificFileEditor => this.setState({ specificFileEditor })}
                      highlight={specificFileEditor => highlight(specificFileEditor, languages.js)}
                      padding={10}
                      readOnly={this.state.edit}
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        border:"1px solid black",
                        borderRadius:"5px",
                        width: "1050px",
                        fontSize: 12,
        
                      }}
                  /></div>
            
          </FadeIn>
        )}</div>
      </div>
    );
  }
}

export default withRouter(SpecificFile);
