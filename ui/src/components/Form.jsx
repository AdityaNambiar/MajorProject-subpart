import React, { Component } from 'react';
import {
  Form, Button, Container, Row, Col
} from 'react-bootstrap';
import "react-step-progress-bar/styles.css";
import { withRouter } from 'react-router-dom';
import { ProgressBar, Step } from "react-step-progress-bar";
import jenkinsicon from '../assets/jenkinsicon.png';
import dockericon from '../assets/dockericon.webp';


class Integration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jenkinsfile: '',
      projName: '',
      progressPercent: 0,
      jenkins_jobdesc: '',
      resp: '',
      branchnames: [ "master", "feature1", "feature2" ],
      projectnames: [ "reactapp", "sampleapp", "newsampleapp" ]
    }
  }
  startIntegration = (e) => {
    e.preventDefault();
    const { projName, jenkinsfile, jenkins_jobdesc } = this.state;

    fetch('http://localhost:5003/integrateAndDeploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName,
          jenkinsfile: jenkinsfile,
          description: jenkins_jobdesc
      })
    })
      .then(resp => resp.text())
      .then(res => {
        this.setState({ resp: res.data });
      })
      .catch(err => {
        console.log(err);
      })
  }

  componentDidUpdate(){

  }
  render() {
    const { progressPercent, resp } = this.state;
    return (
      <Container style={{
        width: "75%",
        margin: "7% auto"
      }}>
        <Form onSubmit={this.startIntegration}>
          <Row>
            <Col>
              <Form.Group>
                <Form.Label>Enter Project name</Form.Label>
                <Form.Control style={{ width: "75%" }} onChange={(e) => this.setState({ projName: e.target.value })} as="select" >
                  { this.state.projectnames.map( elem => <option>{elem}</option>) }
                </Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Enter the branch you want to build</Form.Label>
                <Form.Control style={{ width: "75%" }} onChange={(e) => this.setState({ jenkins_branch: e.target.value })}  as="select">
                  { this.state.branchnames.map( elem => <option>{elem}</option>) }
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Enter Jenkinsfile name (Optional)</Form.Label>
            <Form.Control style={{ width: "75%" }} onChange={(e) => this.setState({ jenkinsfile: e.target.value })} type="text" placeholder="Example: Jenkinsfile" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Enter Job Description (Optional)</Form.Label>
            <Form.Control style={{ width: "75%" }} onChange={(e) => this.setState({ jenkins_jobdesc: e.target.value })} as="textarea" rows="3" type="text" placeholder="Enter some description..." />
          </Form.Group>
          <Form.Group>
            <Form.Label>How often should Jenkins poll the repository?(Optional)</Form.Label>
            <Form.Control style={{ width: "75%" }} onChange={(e) => this.setState({ jenkins_branch: e.target.value })} type="text" placeholder="Example for every two minutes (like how you'd write on Jenkins): H/2 * * * * " />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </Container>
    );
  }
}

export default withRouter(Integration);