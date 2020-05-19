/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";
import axios from "axios";
import {url } from "../utilities/config";
import ThreeDotsLoader from "../loaders/threeDotsLoader";
import GreekingLoader from "../loaders/greekingLoader"
const authServer = require("../api/authServer")
const errorHandle = require("../hooks/errorHandling");

class CommitHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pname: this.props.projectName,
      projectCommits: [],
      commitOf: this.props.commitOf,
      shortHash: "",
      loadingModal: false,
    };
    this.handleCommitMsg = this.handleCommitMsg.bind(this);
    this.handleCommitHash = this.handleCommitHash.bind(this);
  }

  async componentDidMount() {
    // this.setState({ projectCommits: data, loadingModal: false })
   try{
    let {commitOf} = this.props;  
    let {projectName,onBranch,filename} = this.props;
    let body = {
      "projectid":projectName,
      "branchToUpdate":onBranch,
      "filename":filename
    }
    if(commitOf==="branchCommits"){
        this.setState({loadingModal:true});
        body["operation"] = "BRANCHCOMMITHISTORY";
        const {data} = await axios.post(`${url}/checkAccess`,body,{
          headers:{ 
            "x-auth-token":localStorage.getItem("x-auth-token")
          }
        });
        this.setState({loadingModal:false,projectCommits:data.commitObj}) 
    }else{

          this.setState({loadingModal:true});
          body["operation"] = "FILECOMMITHISTORY"
          const {data} = await axios.post(`${url}/checkAccess`,body,{
            headers:{
              "x-auth-token":localStorage.getItem("x-auth-token")
            }
          });
          this.setState({loadingModal:false,projectCommits:data.commitObj})  
    }
   }catch(error){
    errorHandle(error);
    this.setState({loadingModal:false});
   }
  }

  handleCommitMsg = (e,commitHash) => { 
    e.preventDefault();
    this.props.history.push("./commitDifference",{"projectid":this.state.pname,"commitHash":commitHash});
  };
 
  handleCommitHash = (e) => {
    e.preventDefault();
    let access = this.props.access
    let hash = e.target.name;
    let pname = e.target.id;
    localStorage.setItem(pname,hash);
    this.props.history.replace("./project", { projectid: pname,commitHash:hash,access});
    window.location.reload();
   
  };

  render() {
    let loader = null;
    if(this.props.commitOf=="branchCommits"){
        loader =  <GreekingLoader height={"50vh"} width={"100%"}/>
    }else{
        loader =  <ThreeDotsLoader height={"300px"} width={"55%"} />
    }
    let pname = this.state.pname;
    const projectCommitList = this.state.projectCommits.map((projectCommit) => (
      <tr>
        <td>
          <small>{projectCommit.committer_name}</small>
        </td>
        <td>
          <a
            href="#"
            name={projectCommit.commitHash+1}
            onClick={(e)=>this.handleCommitMsg(e,projectCommit.commitHash)}
            data-dismiss="modal"
          >
            <small>{projectCommit.commit_msg}</small>
          </a>
        </td>
        <td>
          <small>
            <a
              href="#"
              name={projectCommit.commitHash}
              id={pname}
              onClick={this.handleCommitHash}
              data-dismiss="modal"
            >
              {projectCommit.commitHash}
            </a>
          </small>
        </td>
        <td>
          <small>{projectCommit.committer_timestamp}</small>
        </td>
      </tr>
    ));
    return (
      <React.Fragment>
        {this.state.loadingModal ? (
          
        <> {loader}</>
        ) : (
          <FadeIn>
            <table class="table table-hover table-sm">
              <thead>
                <tr>
                  <th scope="col">By</th>
                  <th scope="col">Commit message</th>
                  <th scope="col"> Hash</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>{projectCommitList}</tbody>
            </table>
          </FadeIn>
        )}
      </React.Fragment>
    );
  }
}

export default withRouter(CommitHistory);
