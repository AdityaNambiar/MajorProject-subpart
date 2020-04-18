import React, { Component } from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import Spinner from "./../Utils/spinner";

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      requestFailed: false,
      member: {},
      members: [],
      eid: "",
      email: "",
      fname: "",
      lname: "",
      gender: "",
      designation: "",
      contact: "",
    };

    this.onChange = this.onChange.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleRegister = (e) => {
    e.preventDefault();
    const member = {
      eid: this.state.eid,
      email: this.state.email,
      fname: this.state.fname,
      lname: this.state.lname,
      gender: this.state.gender,
      designation: this.state.designation,
      contact: this.state.contact,
    };
    fetch("http://localhost:3000/members", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(member),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        else return res.json();
      })
      .then((data) => {
        this.setState({ member: data });
        console.log("DATA STORED");
      })
      .catch((error) => {
        console.log(error);
        this.setState({ requestFailed: true });
      });
    console.log(member);
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({ loading: false });
      this.props.history.push("./login");
    }, 3000);
  };

  handleOptionChange = (changeEvent) => {
    let name = changeEvent.target.name;
    let value = changeEvent.target.value;
    this.setState({ [name]: value });
  };

  handleAlreadyLogin = () => {
    this.props.history.push("./login");
  };

  render() {
    return (
      <div>
        <div>
          <NavBar />
        </div>
        <div className="container mt-2">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header bg bg-dark text-light font-weight-bold">
                  Register
                </div>
                <div className="card-body">
                  <form name="my-form" action="success.php" method="">
                    <div className="form-group row">
                      <label
                        for="employee_id"
                        className="col-md-4 col-form-label text-md-right"
                      >
                        Employee Id
                      </label>
                      <div className="col-md-6">
                        <input
                          type="text"
                          id="employee_id"
                          className="form-control"
                          name="eid"
                          value={this.state.eid}
                          onChange={this.onChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group row">
                      <label
                        for="email_address"
                        className="col-md-4 col-form-label text-md-right"
                      >
                        E-Mail Address
                      </label>
                      <div className="col-md-6">
                        <input
                          type="text"
                          id="email_address"
                          className="form-control"
                          name="email"
                          value={this.state.email}
                          onChange={this.onChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group row">
                      <label
                        for="first_name"
                        className="col-md-4 col-form-label text-md-right"
                      >
                        First Name
                      </label>
                      <div className="col-md-6">
                        <input
                          type="text"
                          id="first_name"
                          className="form-control"
                          name="fname"
                          value={this.state.fname}
                          onChange={this.onChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group row">
                      <label
                        for="last_name"
                        className="col-md-4 col-form-label text-md-right"
                      >
                        Last Name
                      </label>
                      <div className="col-md-6">
                        <input
                          type="text"
                          id="last_name"
                          className="form-control"
                          name="lname"
                          value={this.state.lname}
                          onChange={this.onChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group form-check row">
                      <label
                        for="gender"
                        className="col-md-4 col-form-label text-md-right pr-4"
                      >
                        Gender
                      </label>
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          name="gender"
                          id="male"
                          value="male"
                          checked={this.state.gender === "male"}
                          onChange={this.handleOptionChange}
                        />
                        <label class="form-check-label" for="male">
                          Male
                        </label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          name="gender"
                          id="female"
                          value="female"
                          checked={this.state.gender === "female"}
                          onChange={this.handleOptionChange}
                        />
                        <label class="form-check-label" for="female">
                          Female
                        </label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          name="gender"
                          id="other"
                          value="other"
                          checked={this.state.gender === "other"}
                          onChange={this.handleOptionChange}
                        />
                        <label class="form-check-label" for="other">
                          Other
                        </label>
                      </div>
                    </div>

                    <div className="form-group row">
                      <label
                        for="designation"
                        className="col-md-4 col-form-label text-md-right"
                      >
                        Designation
                      </label>
                      <div className="col-md-6">
                        <select
                          class="form-control "
                          id="designation"
                          name="designation"
                          onClick={this.handleOptionChange}
                          required
                        >
                          <option
                            value="projectManager"
                            name="designation"
                            selected={
                              this.state.designation === "projectManager"
                            }
                          >
                            Project Manager
                          </option>
                          <option
                            value="developer"
                            name="designation"
                            selected={this.state.designation === "developer"}
                          >
                            Developer
                          </option>
                          <option
                            value="consultant"
                            name="designation"
                            selected={this.state.designation === "consultant"}
                          >
                            Consultant
                          </option>
                          <option
                            value="tester"
                            name="designation"
                            selected={this.state.designation === "tester"}
                          >
                            Tester
                          </option>
                          <option
                            value="intern"
                            name="intern"
                            selected={this.state.designation === "intern"}
                          >
                            Intern
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group row">
                      <label
                        for="phone_number"
                        className="col-md-4 col-form-label text-md-right"
                      >
                        Phone Number
                      </label>
                      <div className="col-md-6">
                        <input
                          type="text"
                          id="phone_number"
                          className="form-control"
                          name="contact"
                          value={this.state.contact}
                          onChange={this.onChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6 offset-md-4">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={this.handleRegister}
                      >
                        {this.state.loading && (
                          <small>
                            Downloading Card <Spinner />
                          </small>
                        )}
                        {!this.state.loading && <small>Register</small>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-4">
          Already Registered?
          <button
            className="btn btn-success ml-2"
            onClick={this.handleAlreadyLogin}
          >
            <small>Login!</small>
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(Register);
