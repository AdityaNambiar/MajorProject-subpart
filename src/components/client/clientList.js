/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";
import ThreeDotsLoader from "../../loaders/threeDotsLoader";
import errorHandle from "../../hooks/errorHandling"
import axios from "axios"
import { url } from "../../utilities/config";

class ClientList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientList: [],
      loadingModal: false,
      btntext:this.props.btntxt
    };
    this.handleClientList = this.handleClientList.bind(this);
  }

  handleClientList = async(e) => {
    e.preventDefault();
    try{
    this.setState({ loadingModal: true });
    const {data} = await axios.post(`${url}/getClients`,{},{
      headers:{
        "x-auth-token":localStorage.getItem("x-auth-token")
      }
    });
     this.setState({ loadingModal: false ,clientList:data});
    }catch(error){
      errorHandle(error);

      this.setState({ loadingModal: false });
     }
  };
  onClickClient = (e,client) => {
    e.preventDefault();
    this.props.updateClient(client);
    localStorage.setItem("chatid",client.cpid)
    this.setState({btntext:client.cpid })
    document.getElementsByClassName("close")[0].click()
  };
  render() {
    const clientList = this.state.clientList.map((clientList) => (
      <div style={{textAlign:"left"}}>
        <li>
          <a href="#" onClick={(e)=>this.onClickClient(e,clientList)}>
            {clientList.cpid.split("$")[0]} 
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
          {this.state.btntext}
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
                  <ol className="mt-4 pl-5">{clientList}</ol>
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
