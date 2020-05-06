import React, { Component } from "react";
//import ClientNavBar from "./clientNavbar";
import { withRouter } from "react-router-dom";
import Spinner from "./../Utils/spinner";

class ClientRegister extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      requestFailed: false,
      client: {},
      clients: [],
      emailid: "",
      fname: "",
      lname: "",
      gender: "",
      contact: "",
      designation: "Client",
    };

    this.onChange = this.onChange.bind(this);
    this.handleClientRegister = this.handleClientRegister.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleClientRegister = (e) => {
    e.preventDefault();
    const client = {
      emailid: this.state.emailid,
      fname: this.state.fname,
      lname: this.state.lname,
      gender: this.state.gender,
      contact: this.state.contact,
      designation: this.state.designation,
    };
    if (
      client.emailid === "" ||
      client.fname === "" ||
      client.lname === "" ||
      client.gender === "" ||
      client.contact === ""
    ) {
      window.alert("Enter all the required details of the client!");
    } else {
      fetch("http://localhost:3000/clients", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(client),
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.status);
          else return res.json();
        })
        .then((data) => {
          this.setState({ client: data });
          console.log("DATA STORED");
        })
        .catch((error) => {
          console.log(error);
          this.setState({ requestFailed: true });
        });
      console.log(client);
      this.setState({ loading: true });
      setTimeout(() => {
        this.setState({ loading: false });
      }, 3000);
    }
  };

  handleOptionChange = (changeEvent) => {
    let name = changeEvent.target.name;
    let value = changeEvent.target.value;
    this.setState({ [name]: value });
  };

  render() {
    return (
      <div>
        <div className="container my-2">
          <div className="row justify-content-center">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header bg bg-dark text-light font-weight-bold">
                  Register Client
                </div>
                <div className="card-body">
                  <form name="my-form" action="success.php" method="">
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
                          name="emailid"
                          value={this.state.emailid}
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
                        onClick={this.handleClientRegister}
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
      </div>
    );
  }
}

export default withRouter(ClientRegister);
