import React, { Component } from 'react';
import {
  Button
} from 'react-bootstrap';
import "react-step-progress-bar/styles.css";
import { withRouter } from 'react-router-dom';


class DeployButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projName: 'reactapp',
      branchName: 'nodeapi',
      tagname: '0.2'
    }
  }
  startDirectDeployment = (e) => {
    e.preventDefault();
    const { projName, branchName, tagname} = this.state

    this.props.history.push('/deploydirect',{
      projName: projName,
      branchName: branchName,
      tagname: tagname
    }) 
  }
  render() {
    return (
      <div>
        <Button onClick={(e) => {this.startDirectDeployment(e)}}>Deploy Directly</Button>
      </div>
    );
  }
}

export default withRouter(DeployButton);