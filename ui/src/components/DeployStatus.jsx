import React, { Component } from 'react';
import {
  Container
} from 'react-bootstrap';
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";
import { withRouter } from 'react-router-dom';
import jenkinsicon from '../assets/jenkinsicon.png';
import dockericon from '../assets/dockericon.webp';


class Integration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      projName: '',
      progressPercent: 0,
      logs: 'HELLLLLLLLLLLLOOOOOOOOOOO'
    }

    //this.startIntegration();
    this.showLogs();
  }
  startIntegration = () => {
    const { projName, jenkinsfile, jenkins_jobdesc } = this.props;

    fetch('http://localhost:5003/integrate', {
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
        this.setState({ projName: res.data, progressPercent: 50 });
      })
      .catch(err => {
        console.log(err); 
      })
  }
  showLogs = (props) => {
    console.log("PROPS: ",this.props);
    const { projName } = this.props;

    fetch('http://localhost:5003/showLogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName
      })
    })
      .then(resp => resp.text())
      .then(res => {
        this.setState({ logs: res.data });
      })
      .catch(err => {
        console.log(err); 
      })
  }
  componentDidUpdate(){
    const { projName, jenkinsfile, jenkins_jobdesc } = this.props;

    fetch('http://localhost:5003/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName
      })
    })
      .then(resp => resp.text())
      .then(res => {
        this.setState({ projName: res.data, progressPercent: 50 });
      })
      .catch(err => {
        console.log(err); 
      })
  }
  render() {
    const { progressPercent, projName } = this.props;
    return (
      <div style={{
        width: "75%",
        margin: "7% auto"
      }}>
        <h2>{projName}</h2>
      
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
          <hr/>
          <div className="text-center bg bg-dark text-light">
                {this.state.logs}
          </div>

      </div>
    );
  }
}

export default withRouter(Integration);