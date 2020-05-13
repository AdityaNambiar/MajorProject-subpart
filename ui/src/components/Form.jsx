import React, { Component } from 'react';
import {
  Form, Button, Container, Row, Col
} from 'react-bootstrap';
import "react-step-progress-bar/styles.css";
import { withRouter } from 'react-router-dom';

class Integration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jenkinsfile: '',
      projName: '',
      jenkins_jobdesc: '',
      branchnames: [ "master", "feature1", "feature2" ],
      projectnames: [ "reactapp", "sampleapp", "newsampleapp", "testapp"]
    }
  }
  startIntegration = (e) => {
    e.preventDefault();
    const { projName, jenkinsfile, jenkins_jobdesc } = this.state; 
    //console.log(projName);
    this.props.history.push('/deploystatus',{
      projName: projName,
      jenkinsfile: jenkinsfile,
      jenkins_jobdesc: jenkins_jobdesc
    })
  }

  render() {
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
                <Form.Control style={{ width: "75%" }} onChange={(e) => this.setState({projName:e.target.value})} as="select" >
                  <option selected disabled hidden></option> 
                  { 
                    this.state.projectnames.map( (elem,key) => <option key={key}>{elem}</option>)
                  }
                </Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Enter the branch you want to build</Form.Label>
                <Form.Control style={{ width: "75%" }} onChange={(e) => this.setState({ jenkins_branch: e.target.value })}  as="select">
                  <option selected disabled hidden></option> 
                  { 
                    this.state.branchnames.map( (elem,key) => <option key={key}>{elem}</option>)
                  }
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