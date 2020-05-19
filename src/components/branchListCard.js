/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import Spinner from "./../Utils/spinner";

import { withRouter } from "react-router-dom";
const errorHandle = require("../hooks/errorHandling");
const authServer = require("../api/authServer");
class BranchListCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pname: this.props.pname,
      loading: false,
      dloading: false,
      branchName: "",
      loadingModal:false
    

    };
    this.mergeBranch = this.mergeBranch.bind(this);
    this.deleteBranch = this.deleteBranch.bind(this);
  }

  mergeBranch = async(e,sourcebranch,desbranch) => {
    e.preventDefault();
    try{
    this.setState({loading:true})
    let body = {
      "projectid":this.props.pname,
        "operation":"MERGEBRANCH",
        "branchToUpdate":desbranch,
        "branchName":sourcebranch,
        "commitHash":this.props.commitHash
    }
   
   const response =  await authServer.post("/checkAccess",body);
   console.log(response)
    this.setState({loading:false});
    window.location.reload(false);
  }catch(error){
    console.log(error)
    errorHandle(error);
    this.setState({loading:false})
    window.location.reload()
  } 
  };

  deleteBranch = async (e) => {
    e.preventDefault();
    let branchName = this.props.branch;
    let branchOn = this.props.branchOn;
    if(branchName==branchOn){
      return alert("You cannot delete a branch on which you are. Please checkout to other branch")
    }
    try{  
      this.setState({dloading:true});
      let body ={
        "projectid":this.props.pname,
        "operation":"DELETEBRANCH",
        "branchToUpdate":branchOn,
        "branchName":branchName,
        "commitHash":this.props.commitHash
      }
        await authServer.post("/checkAccess",body);
      this.setState({dloading:false});
      window.location.reload(false);
    }catch(error){
      errorHandle(error);
      this.setState({dloading:false});
    } 
  };

  render() {
    let {branch,checkoutBranch,branchOn,access} = this.props;

    let bname = branch;
    //console.log(bname);
    let pname = this.state.pname;
    return ( 
          <>
              <div className="card mb-2" >
                    <div className="card-body">
                      <a
                        name="branchName"
                        id={pname}
                        value={bname}
                        className="mr-4 ml-4"
                        href=""
                        onClick={(e)=>{e.preventDefault();checkoutBranch(bname)}}
                      >
                        {bname}
                      </a>
                      {access&&(<div className="btn-group mr-0">
                        <button
                          type="button"
                          name="mergeBtn"
                          value={bname}
                          className="btn btn-warning btn-sm ml-4 mr-2"
                          onClick={(e)=>this.mergeBranch(e,bname,branchOn)}
                          // data-dismiss="modal"
                          disabled={this.state.loading}
                        >
                          {this.state.loading && (
                            <span>
                              Merging Branch <Spinner />
                            </span>
                          )}
                          {!this.state.loading && <span>Merge Branch</span>}
                        </button>

                        {bname=="master"?null:(<button
                          type="button"
                          name="deleteBtn"
                          value={bname}
                          className="btn btn-danger btn-sm"
                          onClick={this.deleteBranch}
                          disabled={this.state.dloading}
                          
                        >
                          {this.state.dloading && (
                            <span>
                              Deleting Branch <Spinner />
                            </span>
                          )}
                          {!this.state.dloading && <span>Delete Branch</span>}
                        </button>)}

                      </div>)}
                    </div>
                  </div>      
          </>
    );
  }
}

export default withRouter(BranchListCard);
