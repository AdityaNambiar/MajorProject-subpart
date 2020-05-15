import React, { Component } from 'react';
import {
  Button, Container, Row, Col
} from 'react-bootstrap';
import "react-step-progress-bar/styles.css";
import { withRouter } from 'react-router-dom';


class DeployButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projName: 'reactapp'
    }
  }
  startDirectDeployment = (e) => {
    e.preventDefault();
    const { projName } = this.state

    this.props.history.push('/deploydirect',{
      projName: projName
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