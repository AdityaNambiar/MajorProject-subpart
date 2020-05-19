import React, { Component } from 'react';
import "react-step-progress-bar/styles.css";
import { withRouter } from 'react-router-dom';
import dockericon from '../assets/dockericon.webp';
import { ProgressBar, Step } from "react-step-progress-bar";

class DeployDirect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      projName: this.props.location.state.projName,
      branchName: this.props.location.state.branchName,
      tagName: this.props.location.state.tagName,
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
    const { projName, branchName, tagName } = this.state;

    fetch('http://localhost:5003/deployDirectly', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
          projName: projName,
          branchName: branchName,
          tagName: tagName
      })
    })
    .then(resp => resp.json())
    .then(res => {
      console.log(res);
      if (res.err) throw new Error(res.err);
      let computedPercent = parseInt(this.state.progressPercent) + parseInt(res.progressPercent);
      this.setState({ urls: res.urls, progressPercent: computedPercent });
    })
    .catch(err => {
      console.log(err);
      let errmsg = err.err || err.message;
      window.alert(errmsg); 
      this.setState({ postResp: err});
    }) 
  }
  showLogs = (e) => {
    e.preventDefault();
    document.getElementById('logarea').classList.toggle("d-none");
    if (!document.getElementById('logarea').classList.contains("d-none")){
      const { projName } = this.props.location.state;
      fetch('http://localhost:5003/showDeployLogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            projName: projName
        })
      })
      .then(resp => resp.json())
      .then(res => {                                                                                                      
        this.setState({ postResp: res.logs });
      })
      .catch(err => {
        console.log(err); 
        this.setState({ postResp: err.err });
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
              {
                ({ accomplished, position }) => (
                <img
                  style={{ 
                    filter: `grayscale(${accomplished ? 0 : 100}%)`, 
                    marginRight: '100%', 
                    borderRadius: '20%'
                  }}
                  width="50"
                  alt=""
                />
              )}
            </Step>
            <Step transition="scale">
              {
                ({ accomplished, position }) => (
                <img
                  style={{ 
                    filter: `grayscale(${accomplished ? 0 : 100}%)`, 
                    marginLeft: '100%', 
                    borderRadius: '20%'
                  }}
                  width="50"
                  alt=""
                  src={dockericon}
                />
              )}
            </Step>
          </ProgressBar>
          <hr className="mt-5"/>
          <textarea id="logarea" value={this.state.postResp} rows="20" className="d-none mt-3 p-5 w-100 bg bg-dark text-light" readOnly>
          </textarea>

          <div className="p-5 w-100 mt-3 bg bg-dark text-center text-light">
          <span>Access your application here:</span><br/>
          {
            this.state.urls.map((url,i) => <span key={i}>{url}</span>)
          }
          </div>
      </div>
    );
  }
}

export default withRouter(DeployDirect);