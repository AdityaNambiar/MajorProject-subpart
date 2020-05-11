import React, { Component } from 'react';
import {
  Form, Button, Container
} from 'react-bootstrap';
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";
import jenkinsicon from '../assets/jenkinsicon.png';
import dockericon from '../assets/dockericon.webp';


class Integration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jenkinsfile: '',
      progressPercent: null
    }
  }
  startIntegration = (e) => {
    e.preventDefault();
    const { jenkinsfile } = this.state;

    fetch('http://localhost:5000/integrateAndDeploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jenkinsfile: jenkinsfile })
    })
      .then(resp => resp.json())
      .then(res => {
        console.log("response from integration server ", res);
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
        margin: "7% auto",
      }}>
        <Form onSubmit={(e) => this.startIntegration}>
          <Form.Group>
            <Form.Label>Enter Jenkinsfile name</Form.Label>
            <Form.Control style={{ width: "50%" }} onChange={(e) => this.setState({ jenkinsfile: e.target.value })} type="text" placeholder="Jenkinsfile" />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>

        <Container style={{ padding: '20%', marginTop: "10vh", boxShadow: "1px 1px 1px 1px rgba(120,194,255,0.8)", borderRadius: '5%' }}>
          <ProgressBar
            percent={progressPercent}
            filledBackground="linear-gradient(to right, #fefb72, #f0bb31)"
          >
            <Step transition="scale">
              {({ accomplished }) => (
                <img
                  style={{ filter: `grayscale(${accomplished ? 0 : 80}%)` , borderRadius: '20%' , marginRight: '100%'}}
                  width="50"
                  alt=""
                  src={jenkinsicon}
                />
              )}
            </Step>
            <Step transition="scale">
              {({ accomplished }) => (
                <img
                  style={{ filter: `grayscale(${accomplished ? 0 : 80}%)`, marginLeft: '100%', borderRadius: '20%'}}
                  width="50"
                  alt=""
                  src={dockericon}
                />
              )}
            </Step>
          </ProgressBar>
        </Container>

        <Container>{this.state.resp}</Container>
      </Container>
    );
  }
}

export default Integration;