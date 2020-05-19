import React, { Component } from "react";
import { withRouter } from "react-router-dom";
//import NavBar from "./navbar";

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleEmployeeLogin = this.handleEmployeeLogin.bind(this);
    this.handleClientLogin = this.handleClientLogin.bind(this);
  }

  handleEmployeeLogin = (e) => {
    e.preventDefault();
    this.props.history.push("./login");
  };
  handleClientLogin = (e) => {
    e.preventDefault();
    this.props.history.push("./clientLogin");
  };

  render() {
    return (
      <div style={{overflowX: "hidden"}}>
        <div
          style={{
            backgroundImage: `url(${require("../assets/icons/home.jpg")})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            minHeight: "100%",
            height: "100vh",
          }}
          className="row"
        >
          <div
            className="text-center text-white col-sm-12 my-auto"
            style={{ marginTop: "auto", marginBottom: "auto" }}
          >
            <h4>Hello user!</h4>
            <h5>Are you?</h5>
            <button
              className="btn btn-outline-primary btn-lg mr-4"
              onClick={this.handleClientLogin}
            >
              Client
            </button>
            <button
              className="btn btn-outline-warning btn-lg"
              onClick={this.handleEmployeeLogin}
            >
              Employee
            </button>
            <br />
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Home);
