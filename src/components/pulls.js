import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";
import Barloader from "../loaders/barLoader";
import NavBar from "./navbar";
import authServer from "../api/authServer"
import errorHandle from "../hooks/errorHandling"
class Pulls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingModal: false,
      pulls: [],
      fileArray: [],
    };
  }

 async componentDidMount() {
    try{
      this.setState({ loadingModal: true });
      let {projectid,branchOn} = this.props.location.state
      let body = {
        "projectid":projectid,
        "operation":"GETMERGEOBJ",
        "branchToUpdate":branchOn, 
      } 
      
        const {data} = await authServer.post("/checkAccess",body);
        console.log(data)
      this.setState({ loadingModal: false ,pulls:data.mainMergeObj});
    }catch(error){
      errorHandle(error);
      // window.location.reload();
    }
  }
 
  handlePullResolve = (e,pullobj) => {
    e.preventDefault();
    console.log(pullobj)
    let {projectid,branchOn} = this.props.location.state;
    if(pullobj.type=="normal"){
      this.props.history.replace("./resolveConflicts", { pullobj: pullobj,projectid,branchOn });
    }else{
      this.props.history.replace("./mergeConflict", { pullobj: pullobj,projectid,branchOn });
    }   
  };

  render() {
    const pulls = this.state.pulls.map((pulls) => (
      <tr key={pulls.mergeid}>
        <td>{pulls.title}</td>
        <td>
          <span class="badge badge-pill badge-danger">
            {pulls.filenamelist.length}
          </span>
        </td>
        <td>{pulls.createdBy}</td>
        <td>{pulls.time}</td>
        <td>
          <a
            // className="btn btn-success btn-sm"
            onClick={(e)=>this.handlePullResolve(e,pulls)}
            href=""
          >
            Resolve
          </a>
        </td>
      </tr>
    ));
    return (
      <div>
        <NavBar />
        <h4 className="bg bg-warning text-center">Pull Requests</h4>
        {this.state.loadingModal ? (
          <Barloader height={"12px"} width={"1110px"} />
        ) : (
          <FadeIn>
            <div className="container text-center">
              <table
                class="container table table-hover table-sm mt-3 mr-5"
                //style={{ width: "80%" }}
              >
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Conflicted Files</th>
                    <th scope="col">Created By</th>
                    <th scope="col">Timestamp</th>
                    {/* <th scope="col">Resolve</th> */}
                  </tr>
                </thead>
                <tbody>{pulls}</tbody>
              </table>
            </div>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default withRouter(Pulls);
