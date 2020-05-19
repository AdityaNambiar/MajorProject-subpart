import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import "../style.css";
import FadeIn from "react-fade-in";
import Notice from "./notice";
import GreekingLoader from "../loaders/greekingLoader";
import axios from "axios"
import Spinner from "../Utils/spinner";
const authServer = require("../api/authServer");
const errorHandle = require("../hooks/errorHandling");
const jwt = require("jsonwebtoken")
const io = require("socket.io-client");
const {socketurl,url} = require("../utilities/config");
const {getTimestamp} = require("../utilities/getTimestamp")

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
      chatid:this.props.chatid,
      username:null,
      pIdentifier:null,
      socket:null,
    };
    this.onChange = this.onChange.bind(this);
  }
  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleDescChange = (value)=>{
    this.setState({desc:value});
    let socket = this.state.socket;
  }

  handlePost = (e) => {
    //console.log("post");
    e.preventDefault();
   try{
    if (this.state.desc === "") {
      window.alert("Enter a valid message to post in forum!");
    } else {
      this.setState({loading:true})
      let {socket,username,desc} = this.state
        const post = {
          username: username,
          message: desc,
          sent:true,
          timestamp: getTimestamp(),
        };
        let decoded  = jwt.decode(localStorage.getItem("x-auth-token"));
        let body={
          cardName:decoded.cardName,
          room:this.state.chatid,
          chat:post,
          chatType:this.props.chatType
        }
        
        socket.emit("chatMessage",body)
        
    }
  }catch(error){
    errorHandle(error);
    this.setState({loading:false})
  }
  };

  async componentDidMount() {
   try{ 
    let token = localStorage.getItem("x-auth-token")
    let {participant,pIdentifier}  = jwt.decode(token);
    this.setState({username:`${participant.fname} ${participant.lname}`})
    let forumFor = this.state.forumFor;
    if (forumFor === "project") {
      this.setState({ loadingModal: true });
      const {data} = await authServer.post("/readProject",{projectid:this.state.chatid});
      this.setState({ loadingModal: false,posts:data.chats });
    } else {
      this.setState({ loadingModal: true });
      const {data} = await axios.post(`${url}/getClientAsset`,{clientid:this.state.chatid},{
        headers:{
          "x-auth-token":token
        }
      });
      this.setState({ loadingModal: false,posts:data.chats });
    }
     
    let socket  = io.connect(socketurl);
   
    socket.on("connect",()=>{
      this.setState({socket:socket})
    })
    socket.on("message",(message)=>{
      console.log(message);
    })

    socket.on("roomUsers",({room,users})=>{
     
      this.setState({usersOnline:users});
      
    })

    socket.on("chatMessage",(chat)=>{
        this.setState({posts:[...this.state.posts,chat],loading:false,desc:""})
        
    })

    socket.on("typing",({user,desc})=>{
     try{
      let {usersOnline} = this.state;
        usersOnline.find((userobj)=>userobj.pIdentifier==user.pIdentifier).typing =  desc.length==0?"": "- typing..."
        this.setState({usersOnline:usersOnline})
     }catch(error){
       
     }
    })
    socket.on("welcomemessage",(msg)=>{
      if(this.state.posts.length==0){
        this.setState({posts:[msg]})
      }
    })
    let {username,chatid} = this.state
    socket.emit("joinRoom",{username:username,room:chatid,pIdentifier})
  }catch(error){
    errorHandle(error);
    this.setState({loadingModal: false})
    window.location.reload();
  }

  }
  componentDidUpdate = (prevProps,prevState)=>{
  
    if(prevState.desc.length!==this.state.desc.length){
     this.state.socket.emit("typing",{desc:this.state.desc})
    }
   
    this.refs.chatmessages.scrollTop = this.refs.chatmessages.scrollHeight
    
  }

  render() {
 
    const usersOnline = this.state.usersOnline.map((usersOnline) => (
      <li key={usersOnline.id}>
        <i
          class="fa fa-user-circle"
          aria-hidden="true"
          style={{ color: "green" }}
        ></i>{" "}
        {usersOnline.username} <label style={{color:"red",fontWeight:"bold",fontSize:16}}>{usersOnline.typing}</label>
      </li>
    
    ));
    return (
      <div >
        <div class="chat-container">
          <header class="chat-header bg bg-info">
            <h3>
              <i class="fa fa-smile"></i> DevOps
            </h3>
          </header>
          <main class="chat-main">
            <div class="chat-sidebar">
              {/* <h4>
                <i class="fa fa-comments"></i> Project Name:
              </h4>
              <h2 id="room-name">DevOps Chain</h2> */}
              <h4>
                <i class="fa fa-users"></i> Users Online
              </h4>
              <ul class="list-group list-group-flush" id="users">{usersOnline}</ul>
            </div>
            <div class="chat-messages bg bg-dark" ref="chatmessages"> 
              {this.state.loadingModal ? (
                <GreekingLoader height={"100%"} width={"100%"} />
              ) : (
                <div>
                  {this.state.posts.map((posts, index) => (
                    <Notice key={index} post={posts} username={this.state.username} />
                  ))}
                </div>
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
                value={this.state.desc}
                onChange={(e)=>this.handleDescChange(e.target.value)}
                style={{borderRadius:"10px",borderColor:"white",}}
              />
              <button class="btn btn-success ml-1" type="submit"
                onClick={(e)=>this.handlePost(e)}
                disabled={this.state.loading}
              >
                {this.state.loading && (
                          <small>
                            <i class="fa fa-paper-plane"></i> Sending... <Spinner/>
                          </small>
                        )}
                        {!this.state.loading && <small><i class="fa fa-paper-plane"></i> Send</small>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Forum);
