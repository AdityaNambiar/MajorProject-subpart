/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";
import ThreeDotsLoader from "../loaders/threeDotsLoader";

class ClientList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientList: [],
      loadingModal: false,
    };
    this.handleClientList = this.handleClientList.bind(this);
  }

  handleClientList = (e) => {
    e.preventDefault();
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/clients")
        .then((res) => res.json())
        .then((clientList) =>
          this.setState({ clientList: clientList, loadingModal: false })
        );
    }, 3000);
  };
  onClickClient = (e) => {
    e.preventDefault();
    window.location.replace("http://localhost:3001/clientDashboard");
  };
  render() {
    const clientList = this.state.clientList.map((clientList) => (
      <div className="ml-4" style={{ marginBottom: "-14px" }}>
        <li>
          <a href="#" onClick={this.onClickClient}>
            {clientList.fname} {clientList.lname}
          </a>
        </li>
        <br />
      </div>
    ));
    return (
      <div className="mt-2">
        <button
          type="button"
          class="btn btn-warning btn-sm"
          data-toggle="modal"
          data-target=".bd-example-modal-sm"
          onClick={this.handleClientList}
        >
          Clients
        </button>

        <div
          class="modal fade bd-example-modal-sm"
          tabindex="-1"
          role="dialog"
          aria-labelledby="mySmallModalLabel"
          aria-hidden="true"
        >
          <div class="modal-dialog modal-sm">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLongTitle">
                  Client List
                </h5>
                <button
                  type="button"
                  class="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              {this.state.loadingModal ? (
                <ThreeDotsLoader height={"100%"} width={"100%"} />
              ) : (
                <FadeIn>
                  <ol className="mt-2">{clientList}</ol>
                </FadeIn>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(ClientList);
