import React, { Component } from "react";

class Notice extends Component {
  state = {};

  render() {
    let post = this.props.post;
    let creator = post.creator;
    let desc = post.desc;
    let designation = post.designation;
    let timestamp = post.timestamp;

    return (
      <div className="">
        <div className="card m-2 bg ">
          <div className="card-body">
            <div>
              <span
                className="float-left text-danger text-monospace"
                style={{ fontWeight: "600" }}
              >
                {creator} ({designation})
              </span>
              <span className="float-right text-danger text-monospace font-italic">
                <small> {timestamp}</small>
              </span>
            </div>
            <br />
            <div className="">
              <small>{desc}</small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default Notice;
