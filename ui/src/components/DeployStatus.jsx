import React, { Component } from 'react';
import {
  Button, Container, Row, Col
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
      postResp: ''
    }
  }
  componentWillUnmount = () => {
    if (this.state.progressPercent !== 100) {
      window.onbeforeunload = function() {
          return "Please wait while your build finishes!";
      }
    }
  }
  componentDidMount = () => {
    const { projName, jenkinsfile, jenkins_jobdesc } = this.props.location.state;

    fetch('http://localhost:5003/integrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName,
          workdirpath: '',
          jenkinsfile: jenkinsfile,
          description: jenkins_jobdesc
      })
    })
    .then(resp => resp.json())
    .then(res => {
      if (res.data === "Build Failed - Check logs!") throw new Error("Build Failed - Check logs!");
      else {
        this.setState({ 
           projName: res.data,
           workdirpath: res.workdirpath, 
           progressPercent: '50' 
        });
        this.startDeployment();
      }
    })
    .catch(err => {
      window.alert(err); 
      this.setState({ progressPercent: '0' });
    })

  }
  startDeployment = () => {
    const { projName,workdirpath } = this.props.location.state;

    fetch('http://localhost:5003/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName,
          workdirpath: workdirpath
      })
    })
    .then(resp => resp.json())
    .then(res => {
      this.setState({ projName: res.data, progressPercent: '100', postResp: res.url });
    })
    .catch(err => {
      window.alert(err); 
      this.setState({ postResp: err , progressPercent: '50'});
    }) 
  }
  showLogs = (e) => {
    e.preventDefault();
    document.getElementById('logarea').classList.toggle("d-none");
    const { projName } = this.props.location.state;
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
      console.log(res);
      this.setState({ postResp: res });
    })
    .catch(err => {
      console.log(err); 
      this.setState({ postResp: err });
    })

  }
  render() {
    const { progressPercent, projName } = this.state;
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
                  style={{ filter: `grayscale(${accomplished ? 0 : 100}%)`, marginLeft: '100%', borderRadius: '20%'}}
                  width="50"
                  alt=""
                  src={dockericon}
                />
              )}
            </Step>
          </ProgressBar>
          <hr className="mt-4"/>
          <Container className="mt-5">
            <Row>
              <Col>
                <Button onClick={(e) => {this.showLogs(e)}}>Show Build Console Logs</Button>
              </Col>
              {/*<Col>
                <Button onClick={(e) => {this.downloadCurrentBuildReport}}>Download last build report</Button>
              </Col>*/}
            </Row>
          </Container>
          <textarea id="logarea" value={this.state.postResp} rows="20" className="d-none mt-3 p-5 w-100 bg bg-dark text-light" readOnly/>

          <div value={this.state.url}  className="p-5 w-100 mt-3 bg bg-dark text-light"></div>
      </div>
    );
  }
}

export default withRouter(Integration);