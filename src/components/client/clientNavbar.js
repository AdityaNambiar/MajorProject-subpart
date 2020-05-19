import React, { Component } from "react";
import { Link, NavLink,withRouter } from "react-router-dom";
import jwt from "jsonwebtoken"
class ClientNavbar extends Component {
  state = {
    participant:jwt.decode(localStorage.getItem("x-auth-token")).participant
  };
  render() {
    let participant = this.state.participant
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <Link className="navbar-brand" to="/home">
          DevOps
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item nav-link ml-2 ">
              <NavLink className="text-warning" to="/home">
                Home
              </NavLink>
            </li>
            <li className="nav-item nav-link ml-2">
              <NavLink className="text-warning" to="/clientRegister">
                Register
              </NavLink>
            </li>
            <li className="nav-item nav-link ml-2">
              <NavLink className="text-warning" to="/clientDashboard">
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item nav-link ml-2 ">
              <label
                style={{ fontWeight: "bold", color: "white" }}
              >{`Welcome ${participant.fname} ${participant.lname}`}</label>
            </li>
            <li className="nav-item nav-link ml-2">
              <button class="btn btn-outline-danger btn-sm my-2 my-sm-0 mr-0"
              onClick={()=>{
                localStorage.removeItem('x-auth-token');
                localStorage.removeItem('chatid');
                localStorage.removeItem('doc');
                this.props.history.replace('/home');
                window.location.reload(true)
              }}
              
              >
                Logout
                
              </button>
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}

export default withRouter(ClientNavbar);
