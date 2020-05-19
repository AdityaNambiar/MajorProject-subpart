/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import FadeIn from "react-fade-in";
import Spinner from "./../Utils/spinner";
import Barloader from "../loaders/barLoader";
import authServer from "../api/authServer";
import errorHandle from "../hooks/errorHandling"
import bufferToString from "../utilities/bufferToString";
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import "../prism.css"
import axios from "axios";
import {url} from "../utilities/config"
class ResolveConflicts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadingModal: false,
      commitMessage: "",
      fileArray: [],
      currentFile: "",
      mergeid:"",
      branchToUpdate:"",
      filedata:{},
      projectid:null,
      branchOn:null
      
    };
    this.onChange = this.onChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileClick = this.handleFileClick.bind(this);
    this.handleCommit = this.handleCommit.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }
  async componentDidMount() { 
    try{
    this.setState({ loadingModal: true });
    let {pullobj,projectid,branchOn} = this.props.location.state;
    
    let body = {
      "projectid":projectid,
      "branchToUpdate":branchOn,
      "mergeobj":pullobj,
      "operation":"READMERGEFILES"
    }
    console.log(body)
    const {data} = await axios.post(`${url}/checkAccess`,body,{
      headers:{
        'x-auth-token':localStorage.getItem('x-auth-token')
      }
    });
    console.log(data)
    let {buffer,mergeid} = data;
    this.setState({ loadingModal: false ,fileArray:buffer,mergeid:mergeid,projectid:projectid,branchOn:branchOn});
    }catch(error){
      errorHandle(error);
      window.location.reload();
    }
  }

  handleChange(value) { 
    let {currentFile,filedata} = this.state;
    filedata[currentFile] = value;
    this.setState({ filedata: filedata });
  }

  handleFileClick = (e,file) => {
    e.preventDefault();
    let filecontent = bufferToString(file.data.data);
    let filedata = this.state.filedata
    if(filedata[file.name]==undefined){
      filedata[file.name] = filecontent;
    }
    this.setState({ text: filecontent, currentFile: file.name});
  };

  handleCommit = async (e) => {
    e.preventDefault();
   try{ 
    let commitMessage = this.state.commitMessage;
    if (commitMessage === "") {
      window.alert("Commit Message cannot be blank!!");
    } else {
      this.setState({ loading: true });
      let {mergeid,filedata,branchOn,projectid} = this.state;
      // let filebuffobj = {}
      // for(let file in filedata){
      //   filebuffobj[file] = stringToBuffer(filedata[file]);
      // }
      
      let body = { 
        mergeobj:JSON.stringify({branchToUpdate:branchOn,mergeid:mergeid}),
        filebuffobj: JSON.stringify(filedata),
        projectid:projectid, 
        operation:"MERGECOMMIT",
        usermsg:commitMessage
      }
      const {data} = await axios.post(`${url}/checkAccess`,body,{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token"),
        },
       
      });
     let {mergeobj}  = data;
      let status = mergeobj.filter((obj)=>obj.mergeid==mergeid);
      if(status.length>0){
        alert("More Conflicts arised, please solve it");
        window.location.reload();
      }else{
        this.setState({loading:false});
       return this.props.history.replace("/pulls", { projectid: projectid,branchOn:branchOn});
      }
      this.setState({loading:false})
    }
  }catch(error){
    errorHandle(error);
    this.setState({loading:false})
    // window.location.reload()
  } 
  };

  render() {

    let {fileArray,filedata,currentFile} = this.state

    const conflictedFiles = fileArray.map((file, index) => (
      <tr key={index}>
        {/* <th scope="row">{file.name}</th> */}
        <td>
          <a
            href=""
            onClick={(e)=>this.handleFileClick(e,file)}
          >
            {file.name}
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
                      {/* <th scope="col">#</th> */}
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
                
                
                {Object.keys(filedata).length>0&&(<Editor
                      value={filedata[currentFile]}
                      onValueChange={specificFileEditor =>this.handleChange(specificFileEditor)}
                      highlight={specificFileEditor => highlight(specificFileEditor, languages.js)}
                      padding={10}
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        border:"1px solid black",
                        borderRadius:"5px",

                        fontSize: 12,
                      }}
                  />)}

                
                {/* <textarea
                      name="specificFileEditor"
                      class="form-control mt-1 mb-2 bg bg-dark text-light"
                      id="exampleFormControlTextarea1"
                      rows="22"
                      style={{fontSize:"14px",height:"80vh"}}
                      value={this.state.filedata[this.state.currentFile]}
                      onChange={(e)=>this.handleChange(e.target.value)}
                    ></textarea> */}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default withRouter(ResolveConflicts);
