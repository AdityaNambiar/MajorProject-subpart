import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import NavBar from "./navbar";
import FadeIn from "react-fade-in";
import Spinner from "./../Utils/spinner";
import Barloader from "../loaders/barLoader";
import axios from "axios";
import {url} from "../utilities/config";
import errorHandle from "../hooks/errorHandling";
import downloadRepo from "../hooks/downloadCard";
class MergeConflict extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingModal: false,
      dloading: false,
      ploading: false,
      errorMessage:"",
      mergeobj:this.props.location.state.pullobj,
      projectid:this.props.location.state.projectid,
      branchOn:this.props.location.state.branchOn

    };
   
    this.handleDloadRepo = this.handleDloadRepo.bind(this);
  
  }


  handleDloadRepo = async (e) => {
    e.preventDefault();
    try{
      this.setState({ dloading: true });
      let {mergeobj,projectid,branchOn} = this.state;
      let body = {
        "projectid":projectid,
        "branchToUpdate":branchOn,
        "mergeid":mergeobj.mergeid,
        "operation":"DOWNLOADFORCLI"
      }
      const res = await axios.post(`${url}/checkAccess`,body,{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        },
        responseType:"arraybuffer"
      })
      downloadRepo(res,`${projectid}.zip`)
      this.setState({ dloading: false });
      this.props.history.replace("/pulls",{projectid,branchOn})
     

    }catch(error){
      errorHandle(error);
      this.setState({ dloading: false });
    }
    
   
  };

  getInstructions = ()=>{
    let {mergeobj} = this.state;
    let instructions = "";
    mergeobj.instructions.map((txt,i)=>{
    instructions = instructions + txt + "\n"
    });
    console.log(instructions)
    return  instructions
  }

  render() {

    return (
      <div>
        <NavBar />
        <div className="container">
          {this.state.loadingModal ? (
            <Barloader height={"12px"} width={"1110px"} />
          ) : (
            <FadeIn>
              <form style={{marginTop:"10px"}}>
                <div className="form-group">
                  <label for="exampleFormControlTextarea1">
                    Error message:
                  </label>
                  <textarea
                    className="form-control"
                    id="exampleFormControlTextarea1"
                    rows="10"
                    disabled
                  >
                  {this.getInstructions()}
                  </textarea>
                  <div className="text-center">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm m-2"
                      onClick={this.handleDloadRepo}
                    >
                      {this.state.dloading && (
                        <span>
                          Downloading <Spinner />
                        </span>
                      )}
                      {!this.state.dloading && <span>Download Repository</span>}
                    </button>
                  </div>
                </div>
              </form>
            </FadeIn>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(MergeConflict);
