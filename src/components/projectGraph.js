import React, { Component } from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import FadeIn from "react-fade-in";
import BarLoader from "../loaders/barLoader"
const errorHandle  = require("../hooks/errorHandling");
const authServer = require("../api/authServer")
class ProjectGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingModal: false,
      graph: "this is  a sample graph text",
    };
  }

  componentDidMount = async ()=> {
    
    try{
      let {projectid,branchOn} = this.props.location.state;
      let body ={
        "projectid":projectid,
        "branchToUpdate":branchOn,
        "operation":"GITGRAPH"
      }
      this.setState({ loadingModal: true });
      const {data} = await authServer.post("/checkAccess",body)
      const graphOutput  = Buffer.from(data.graphOutput.data).toString();
      this.setState({ loadingModal: false,graph:graphOutput });
    }catch(error){
      errorHandle(error);
      this.setState({ loadingModal: false });
    }
  }

  render() {
    let propsObj = this.props.location.state;
    let pname = propsObj.projectid;
    return (
      <div>
        <NavBar  projectid={pname} />
        <div className="container">
          <h5 className="bg bg-warning sticky-top text-center">
            Project Name: {pname}
          </h5>
          {this.state.loadingModal ? (
            <BarLoader height="12px" />
          ) : (
            <FadeIn>
              <div className="mt-1 mx-4 mr-4 bg bg-light" disabled={true}>
                    <textarea
                      name="createFileEditor"
                      class="form-control mt-1 mb-2 bg bg-dark text-light"
                      id="exampleFormControlTextarea1"
                      rows="16"
                      value={this.state.graph}
                      disabled={true}
                    ></textarea>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    );
  }
}
export default withRouter(ProjectGraph);
