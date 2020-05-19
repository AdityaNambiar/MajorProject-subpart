import React, { Component } from 'react';
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";
import { withRouter } from 'react-router-dom';
import jenkinsicon from '../assets/jenkinsicon.png';
import dockericon from '../assets/dockericon.webp';


class Integration extends Component {
  constructor(props) {
    super(props);

    console.log("CONSTRUCTOR EXECUTED");
    this.state = {
      projName: this.props.location.state.projName,
      branchName: this.props.location.state.branchName,
      tagName: this.props.location.state.tagName,
      jenkinsfile: this.props.location.state.jenkinsfile,
      jenkins_jobdesc: this.props.location.state.jenkins_jobdesc,
      progressPercent: '0',
      postResp: '',
      urls: []
    }
  }
  componentWillUnmount = () => {
      window.onbeforeunload = function() {
          return "Please wait while your build finishes!";
      }
  }
  componentDidMount = () => {
    console.log("COMPONENT DID MOUNT EXECUTED");
    const { projName, branchName, jenkinsfile, jenkins_jobdesc } = this.state;

    fetch('http://localhost:5003/integrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName,
          branchName: branchName,
          jenkinsfile: jenkinsfile,
          description: jenkins_jobdesc
      })
    })
    .then(resp => resp.json())
    .then(res => {
      console.log("res: ",res);
      if (res.err === "Build Failed - Check logs!") throw new Error("Build Failed - Check logs!");
      else {
        let computedPercent = parseInt(this.state.progressPercent) + parseInt(res.progressPercent);
        this.setState({ 
           projName: res.projName,
           branchName: res.branchName,
           progressPercent: computedPercent
        });
        this.startDeployment();
      }
    })
    .catch(err => {
      console.log(err);
      let errmsg = err.err || err.message;
      window.alert(errmsg); 
      this.setState({ progressPercent: '0' });
    })

  }
  startDeployment = () => {
    const { projName, tagname, branchName } = this.state;

    fetch('http://localhost:5003/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName,
          branchName: branchName,
          tagName: tagname
      })
    })
    .then(resp => resp.json())
    .then(res => {
      console.log(res);
      if (res.err) throw new Error(res.err);
      let computedPercent = parseInt(this.state.progressPercent) + parseInt(res.progressPercent);
      this.setState({ projName: res.projName, progressPercent: computedPercent, urls: res.urls });
    })
    .catch(err => {
      console.log(err);
      let errmsg = err.err || err.message;
      window.alert(errmsg);  
      this.setState({ postResp: err , progressPercent: '50'});
    }) 
  }
  showLogs = (e) => {
    e.preventDefault();
    document.getElementById('logarea').classList.toggle("d-none");
    if (!document.getElementById('logarea').classList.contains("d-none")){
      const { projName } = this.state;

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
        this.setState({ postResp: res });
      })
      .catch(err => {
        console.log(err); 
        this.setState({ postResp: err });
      })
    }
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
          <textarea id="logarea" value={this.state.postResp} rows="20" className="d-none mt-3 p-5 w-100 bg bg-dark text-light" readOnly/>

          <div className="p-5 w-100 mt-3 bg bg-dark text-center text-light">
          <span>Access your application here:</span><br/>
          {
            this.state.urls.map(url => <span>{url}</span>)
          }
          </div>
      </div>
    );
  }
}

export default withRouter(Integration);