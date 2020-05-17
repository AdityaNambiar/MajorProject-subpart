import React, { Component } from 'react';
import {
  Button, Container, Row, Col
} from 'react-bootstrap';
import "react-step-progress-bar/styles.css";
import { withRouter } from 'react-router-dom';
import JSONPretty from 'react-json-pretty';

class DeployDirect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      projName: this.props.location.state.projName,
      branchName: this.props.location.state.branchName,
      tagname: this.props.location.state.tagname,
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
    const { projName, branchName, tagname } = this.state;

    fetch('http://localhost:5003/deployDirectly', {
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
      this.setState({ urls: res.urls });
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
    const { projName } = this.state;
    return (
      <div style={{
        width: "75%",
        margin: "5% auto"
      }}>
        <h2>{projName}</h2>
      
          <hr className="mt-5"/>
          <Container className="mt-5">
            <Row>
              <Col>
                <Button onClick={(e) => {this.showLogs(e)}}>Show Build Console Logs</Button>
              </Col>
            </Row>
          </Container>
          <textarea id="logarea" value={this.state.postResp} rows="20" className="d-none mt-3 p-5 w-100 bg bg-dark text-light" readOnly>
          </textarea>

          <div className="p-5 w-100 mt-3 bg bg-dark text-center text-light">
          <span>Access your application here</span><br/>
          {
            this.state.urls.map(url => <span>{url}</span>)
          }
          </div>
      </div>
    );
  }
}

export default withRouter(DeployDirect);