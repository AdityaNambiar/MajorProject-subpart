import React, { Component } from 'react';
import {
  Container
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
      projName: '',
      progressPercent: 0,
      jenkins_jobdesc: '',
      resp: ''
    }
  }
  startIntegration = (e) => {
    e.preventDefault();
    const { projName, jenkinsfile, jenkins_jobdesc } = this.state;

    fetch('http://localhost:5000/integrateAndDeploy', {
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
      <h4>Resp: {resp}</h4>
        <Container style={{ padding: '20%', boxShadow: "1px 1px 1px 1px rgba(120,194,255,0.8)", borderRadius: '5%' }}>
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

      </Container>
    );
  }
}

export default Integration;