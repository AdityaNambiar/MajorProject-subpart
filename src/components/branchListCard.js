/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import Spinner from "./../Utils/spinner";
import { withRouter } from "react-router-dom";

class BranchListCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pname: this.props.pname,
      loading: false,
      dloading: false,
      branchName: "",
      mergeBtn: "",
      deleteBtn: "",
    };
    this.handleBranchCheckout = this.handleBranchCheckout.bind(this);
    this.mergeBranch = this.mergeBranch.bind(this);
    this.deleteBranch = this.deleteBranch.bind(this);
  }

  handleBranchCheckout = (bname) => (e) => {
    e.preventDefault();
    this.setState({ branchName: e.target.value });
    let branchName = bname;
    let pname = e.target.id;
    //console.log(branchName, pname);
    this.props.history.push("./project", {
      branchname: branchName,
      pname: pname,
    });
    window.location.reload();
  };

  mergeBranch = (e) => {
    e.preventDefault();
    this.setState.loading = true;
    this.setState({ [e.target.name]: e.target.value });
    this.props.history.replace("./mergeConflict");
    this.setState.loading = false;
  };

  deleteBranch = (e) => {
    e.preventDefault();
    this.setState.dloading = true;
    this.setState({ [e.target.name]: e.target.value });
    this.setState.dloading = false;
  };

  render() {
    let branch = this.props.branch;

    let bname = branch.bname;
    //console.log(bname);
    let pname = this.state.pname;
    return (
      <div className="card mb-2">
        <div className="card-body">
          <a
            href="#"
            name="branchName"
            id={pname}
            value={bname}
            className="mr-4 ml-4"
            onClick={this.handleBranchCheckout(bname)}
          >
            {bname}
          </a>
          <div className="btn-group mr-0">
            <button
              type="button"
              name="mergeBtn"
              value={bname}
              className="btn btn-warning ml-4 mr-2 float-right"
              onClick={this.mergeBranch}
              data-dismiss="modal"
            >
              {this.state.loading && (
                <span>
                  Merging Branch <Spinner />
                </span>
              )}
              {!this.state.loading && <span>Merge Branch</span>}
            </button>

            <button
              type="button"
              name="deleteBtn"
              value={bname}
              className="btn btn-danger float-right"
              onClick={this.deleteBranch}
            >
              {this.state.dloading && (
                <span>
                  Deleting Branch <Spinner />
                </span>
              )}
              {!this.state.dloading && <span>Delete Branch</span>}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(BranchListCard);
