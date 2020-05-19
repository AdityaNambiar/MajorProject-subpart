/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/alt-text */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";

class Label extends Component {
  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
    this.state = {
      projectName: this.props.projectName,
      commitMessage:"",
      fileTimestamp: "30/3/2020 - 4:7:20 IST",
    };
    this.handleSpecificFile = this.handleSpecificFile.bind(this);
    this.handleFileCommitMsg = this.handleFileCommitMsg.bind(this);
  }

  img = {
    width: "30px",
    height: "30px",
    backgroundColor: "white",
    border: "1px solid white",
    borderRadius: "10%",
    padding: "3px",
    fontSize: "15px",
  };
  label = {
    //height: "35px",
    textAlign: "left",
    //padding: "3px 18px 3px 8px",
    overflowX: "auto",
    overflowY: "hidden",
    //fontSize: "16px",
    //borderBottom: "1px solid grey",
    transform: "scale(1,1)",
    //margin: "10px",
  };
 
  handleSpecificFile = (e) => {
    e.preventDefault();
    let fname = e.target.name;
    let projectName = this.state.projectName;
    this.props.history.push("./specificFile", {
      fname: fname,
      projectName: projectName,
      onBranch:this.props.onBranch,
      commitHash:this.props.commitHash,
      access:this.props.access
    }); 
  };

  handleFileCommitMsg = (e) => {
    e.preventDefault();
    let projectName = this.state.projectName;
    this.props.history.push("./commitDifference", {
      pname: projectName,
    });
  };
  render() { 
    var { labelobj } = this.props;
    console.log("From Label",this.props.commitHash)
    return (
      <React.Fragment>
        <tr>
          <td>
            <label style={this.label}>
              <img
                src={require("./../assets/icons/" + [labelobj.image])}
                style={this.img}
              />
              <small>
                <a
                  href="#"
                  onClick={this.handleSpecificFile}
                  name={labelobj.name}
                >
                  {labelobj.name}
                </a>
              </small>
            </label>
          </td>
          <td>
            <small>
              <a href="" onClick={(e)=>e.preventDefault()} >
                {labelobj.commitmsg}
              </a>
            </small>
          </td>
          <td>
            <small>{labelobj.time}</small>
          </td>
        </tr>
      </React.Fragment>
    );
  }
}
export default withRouter(Label);
