import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import "../style.css";
import FadeIn from "react-fade-in";
import Notice from "./notice";
import GreekingLoader from "../loaders/greekingLoader";

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
      forumFor: this.props.forumFor,
      usersOnline: [],
    };
    this.onChange = this.onChange.bind(this);
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
    let forumFor = this.state.forumFor;
    if (forumFor === "project") {
      setTimeout(() => {
        fetch("http://localhost:3000/posts")
          .then((res) => res.json())
          .then((posts) =>
            this.setState({ posts: posts, loadingModal: false })
          );
        //window.scrollTo(0, 9999);
      }, 3000);
    } else {
      setTimeout(() => {
        fetch("http://localhost:3000/clientChats")
          .then((res) => res.json())
          .then((posts) =>
            this.setState({ posts: posts, loadingModal: false })
          );
      }, 3000);
    }
    fetch("http://localhost:3000/usersOnline")
      .then((res) => res.json())
      .then((usersOnline) => this.setState({ usersOnline: usersOnline }));
  }

  render() {
    const usersOnline = this.state.usersOnline.map((usersOnline) => (
      <li key={usersOnline.id}>
        <i
          class="fa fa-user-circle"
          aria-hidden="true"
          style={{ color: "green" }}
        ></i>{" "}
        {usersOnline.fname} {usersOnline.lname}
      </li>
    ));
    return (
      <div>
        <div class="chat-container">
          <header class="chat-header bg bg-info">
            <h3>
              <i class="fa fa-smile"></i> DevOps
            </h3>
          </header>
          <main class="chat-main">
            <div class="chat-sidebar">
              <h4>
                <i class="fa fa-comments"></i> Project Name:
              </h4>
              <h2 id="room-name">DevOps Chain</h2>
              <h4>
                <i class="fa fa-users"></i> Users Online
              </h4>
              <ul id="users">{usersOnline}</ul>
            </div>
            <div class="chat-messages bg bg-dark">
              {this.state.loadingModal ? (
                <GreekingLoader height={"100%"} width={"100%"} />
              ) : (
                <FadeIn>
                  {this.state.posts.map((posts, index) => (
                    <Notice key={index} post={posts} />
                  ))}
                </FadeIn>
              )}
            </div>
          </main>
          <div class="chat-form-container">
            <form id="chat-form">
              <input
                id="msg"
                type="text"
                placeholder="Enter Message"
                required
                autocomplete="off"
              />
              <button class="btn btn-success ml-1">
                <i class="fa fa-paper-plane"></i> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Forum);
