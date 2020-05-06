/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import ClientNavbar from "./clientNavbar";
import Forum from "./forum";
import ClientAttachment from "./clientAttachments";
import ClientRegister from "./clientRegister";
import ClientList from "./clientList";
import Spinner from "./../Utils/spinner";

class ClientDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
    this.handleClientDocUpload = this.handleClientDocUpload.bind(this);
  }

  handleClientDocUpload = (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({ loading: false });
    }, 3000);
  };

  render() {
    return (
      <div>
        <ClientNavbar />
        <div className="container mt-2">
          {/* -------------------------Button trigger create client modal---------------------------------- */}
          <div className="d-flex flex-row-reverse">
            <ClientList />
            <button
              type="button"
              className=" btn btn-danger btn-sm m-2 ml-4 col-md-1 "
              data-toggle="modal"
              data-target=".bd-example-modal-lg"
            >
              Create Client
            </button>
            <div
              class="modal fade bd-example-modal-lg"
              tabindex="-1"
              role="dialog"
              aria-labelledby="myLargeModalLabel"
              aria-hidden="true"
            >
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <ClientRegister />
                </div>
              </div>
            </div>
          </div>
          <ul class="nav nav-pills ml-3 mb-1" id="pills-tab" role="tablist">
            <li class="nav-item">
              <a
                class="nav-link active"
                id="attachments-tab"
                data-toggle="pill"
                href="#attachments"
                role="tab"
                aria-controls="attachments"
                aria-selected="true"
              >
                Attachments
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link "
                id="forum-tab"
                data-toggle="pill"
                href="#forum"
                role="tab"
                aria-controls="forum"
                aria-selected="false"
              >
                Forum
              </a>
            </li>
          </ul>
          <div class="tab-content" id="pills-tabContent">
            <div
              class="tab-pane fade show active"
              id="attachments"
              role="tabpanel"
              aria-labelledby="attachments-tab"
            >
              <div class="container">
                <div class="row">
                  <div class="col-md-6 mt-4">
                    <form method="post" action="#" id="#">
                      <div class="form-group files">
                        <input
                          type="file"
                          class="form-control"
                          multiple="true"
                          onChange={this.getFile}
                        />
                      </div>
                      <button
                        type="button"
                        class="float-right btn btn-primary btn-sm"
                        onClick={this.handleClientDocUpload}
                      >
                        {this.state.loading && (
                          <small>
                            Uploading <Spinner />
                          </small>
                        )}
                        {!this.state.loading && <small>Upload</small>}
                      </button>
                    </form>
                  </div>
                  <div className="col-md-6 mt-4">
                    <h5 className="bg bg-warning text-center">
                      Shared Attachments
                    </h5>
                    <ClientAttachment />
                  </div>
                </div>
              </div>
            </div>
            <div
              class="tab-pane fade "
              id="forum"
              role="tabpanel"
              aria-labelledby="forum-tab"
            >
              <Forum forumFor={"clientChats"} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(ClientDashboard);
