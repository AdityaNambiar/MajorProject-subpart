import React, { Component } from "react";
import { Link, NavLink } from "react-router-dom";
class NavBar extends Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <Link className="navbar-brand" to="/login">
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
              <NavLink className="text-warning" to="/login">
                Login
              </NavLink>
            </li>
            <li className="nav-item nav-link ml-2">
              <NavLink className="text-warning" to="/register">
                Register
              </NavLink>
            </li>
            <li className="nav-item nav-link ml-2">
              <NavLink className="text-warning" to="/dashboard">
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item nav-link ml-2">
              <NavLink className="text-warning" to="/publicProjects">
                Public Projects
              </NavLink>
            </li>
            <li className="nav-item nav-link ml-2 ">
              <label
                style={{ fontWeight: "bold", color: "white" }}
              >{`Welcome ${"username"}`}</label>
            </li>
            <li className="nav-item nav-link ml-2">
              <button class="btn btn-outline-danger btn-sm my-2 my-sm-0 mr-0">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}

export default NavBar;
