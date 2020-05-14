import React, { Component } from "react";

class Notice extends Component {
  state = {
    userName: "Gopi",
  };

  render() {
    let post = this.props.post;
    let creator = post.creator;
    let desc = post.desc;
    let designation = post.designation;
    let timestamp = post.timestamp;
    let tooltipContent = ` ${post.creator} \n ${post.designation} \n ${post.timestamp}`;

    if (creator === this.state.userName) {
      return (
        <div className="">
          <div
            className="card mb-2 float-right"
            style={{
              width: "80%",
              backgroundColor: "#DCF8C6",
              fontFamily: "Arial",
              borderRadius: "10px",
            }}
          >
            <div className="card-body" style={{ padding: "10px" }}>
              <div class="message">
                <p
                  class="meta"
                  data-toggle="tooltip"
                  data-placement="top"
                  title={tooltipContent}
                >
                  {creator} ({designation})
                  <span className="float-right">{timestamp}</span>
                </p>
                <p style={{ marginBottom: "0" }}>
                  <small>{desc}</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="">
        <div
          className="card mb-2 bg float-left"
          style={{
            width: "80%",
            fontFamily: "Arial",
            borderRadius: "10px",
          }}
        >
          <div className="card-body" style={{ padding: "10px" }}>
            <div class="message">
              <p
                class="meta"
                data-toggle="tooltip"
                data-placement="top"
                title={tooltipContent}
              >
                {creator} ({designation})
                <span className="float-right">{timestamp}</span>
              </p>
              <p style={{ marginBottom: "0" }}>
                <small>{desc}</small>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default Notice;
