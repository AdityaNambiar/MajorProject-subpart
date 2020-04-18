import React, { Component } from "react";
import Notice from "./notice";
import Spinner from "./../Utils/spinner";
import "../project.css";
import FadeIn from "react-fade-in";

class Forum extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      post: {},
      desc: "",
      timestamp: "",
      loading: false,
      loadingModal: false,
      requestFailed: false,
    };
    this.onChange = this.onChange.bind(this);
    this.handlePost = this.handlePost.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handlePost = (e) => {
    //console.log("post");
    e.preventDefault();
    if (this.state.desc === "") {
      window.alert("Enter a valid message to post in forum!");
    } else {
      this.setState({ loading: true, loadingModal: true });
      let currentDate = new Date();
      let date = currentDate.getDate();
      let month = currentDate.getMonth();
      let year = currentDate.getFullYear();
      let h = currentDate.getHours();
      let m = currentDate.getMinutes();
      let s = currentDate.getSeconds();
      let timestamp =
        date +
        "/" +
        (month + 1) +
        "/" +
        year +
        " - " +
        h +
        ":" +
        m +
        ":" +
        s +
        " IST";

      const post = {
        creator: "Gopi Mehta",
        designation: "Developer",
        desc: this.state.desc,
        timestamp: timestamp,
      };
      console.log(post);
      fetch("http://localhost:3000/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(post),
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.status);
          else return res.json();
        })
        .then((data) => {
          this.setState({ post: data });
          console.log("DATA STORED");
        })
        .catch((error) => {
          console.log(error);
          this.setState({ requestFailed: true });
        });
      setTimeout(() => {
        this.setState({ loading: false, loadingModal: false });
      }, 3000);
    }
    //window.location.reload(true);
  };

  componentWillMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/posts")
        .then((res) => res.json())
        .then((posts) => this.setState({ posts: posts, loadingModal: false }));
    }, 3000);
  }

  render() {
    return (
      <div
        className="card  col-md-6  ml-4 bg-dark"
        style={{
          marginTop: "-54px",
          overflowY: "auto",
          height: "520px",
        }}
      >
        <label className="text-center p-2 my-2 bg-info text-white sticky-top">
          Project Discussion Forum
        </label>
        {/* Display message functionality  */}
        <div>
          {this.state.loadingModal ? (
            <lottie-player
              src="https://assets8.lottiefiles.com/packages/lf20_4K1MLC.json"
              background="#ffffff"
              speed="1"
              style={{ width: "660px", height: "460px" }}
              loop
              autoplay
            ></lottie-player>
          ) : (
            <FadeIn>
              {this.state.posts.map((posts, index) => (
                <Notice key={index} post={posts} />
              ))}
            </FadeIn>
          )}
        </div>
        {/* Project Discussion message send functionality  */}
        <div id="main">
          <div id="sendprojectmessagetextdiv">
            <textarea
              class="form-control "
              name="desc"
              id="sendprojectmessagetextarea"
              rows="2"
              placeholder="Enter your message..."
              onChange={this.onChange}
            ></textarea>
          </div>

          <button
            type="button"
            className="btn btn-success rounded "
            id="sendprojectmessagebtn"
            onClick={this.handlePost}
            disabled={this.state.loading}
          >
            {this.state.loading && (
              <span>
                Posting <Spinner />
              </span>
            )}
            {!this.state.loading && <span>Post</span>}
          </button>
        </div>
      </div>
    );
  }
}

export default Forum;
