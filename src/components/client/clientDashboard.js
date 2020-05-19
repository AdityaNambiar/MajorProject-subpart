/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import ClientNavbar from "./clientNavbar";
import Forum from "../forum";
import ClientAttachment from "./clientAttachments";
import ClientRegister from "./clientRegister";
import ClientList from "./clientList";
import Spinner from "../../Utils/spinner";
import jwt from "jsonwebtoken"
import errorHandle from "../../hooks/errorHandling"
import axios from "axios"
import {url,ipfsUrl} from "../../utilities/config"
import GreekingLoader from "../../loaders/greekingLoader";

import FadeIn from "react-fade-in";
class ClientDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
     navOn:"attachments",
    //  documentHash:localStorage.getItem("doc")==null?"":localStorage.getItem("doc"),
    documentHash:[],
     clientid:localStorage.getItem("chatid")==null?"":localStorage.getItem("chatid"),
     loadingModal:false,
     
    };
    this.handleClientDocUpload = this.handleClientDocUpload.bind(this);
  }

  handleClientDocUpload = async(e) => {
    e.preventDefault();
    try{
      this.setState({ loading: true });
      let ipfsFiles = e.target.myfile.files
      let formdata = new FormData()
      for(let i=0;i<ipfsFiles.length;i++){
        formdata.append(i,ipfsFiles[i]);
      }
      let token = localStorage.getItem("x-auth-token");
      const {data} = await axios.post(`${ipfsUrl}/createDocument`,formdata,{
        headers:{
          "x-auth-token":token,
          'Content-Type': 'multipart/form-data'
        },
        
      })
      let body = {
        cpid:this.state.clientid,
        documenthash:data
      }
      const response = await axios.post(`${url}/addDocumentHash`,body,{
        headers:{
          "x-auth-token":token
        }
      })
      window.location.reload()
      this.setState({ loading: false,documentHash:data });

    }catch(error){
      errorHandle(error);
      this.setState({ loading: false });
    }
   
  };

 
componentDidMount = async ()=>{
  let token = localStorage.getItem('x-auth-token')
  let {pType,pIdentifier}=  jwt.decode(token)
  if(pType=="Client"){
    this.setState({loadingModal:true});
      const {data} = await axios.post(`${url}/getClientAsset`,{clientid:pIdentifier},{
        headers:{
          "x-auth-token":token
        }
      });
      let {cpid,clientDocumentHash} = data;
      localStorage.setItem("chatid",cpid)
      this.setState({clientid:cpid,documentHash:clientDocumentHash.length>0?clientDocumentHash:[],loadingModal:false});
      
  }
  else if(pType=="ProjectManager"){
    try{
      
      let clientid = this.state.clientid
      if(clientid==""){
        return 
      }
      this.setState({loadingModal:true});
      const {data}= await axios.post(`${url}/getClients`,{},{
        headers:{
          "x-auth-token":token
        }
      });
      let {clientDocumentHash,cpid} = data.filter((client)=>client.cpid==clientid)[0]
       this.setState({clientid:cpid ,documentHash:clientDocumentHash.length>0?clientDocumentHash:[],loadingModal:false});
      }catch(error){
        errorHandle(error);
       }
  }
}
updateClient = (client)=>{
  let clientid = client.cpid;
  let hasharr = client.clientDocumentHash;
  let documentHash = hasharr.length>0?hasharr[0]:"";
  // localStorage.setItem("doc",documentHash);
  // this.setState({clientid,documentHash});
  window.location.reload()

}


  render() {
    let {navOn,documentHash,clientid} = this.state
    let pType=  jwt.decode(localStorage.getItem('x-auth-token')).pType
    return (
      <div>
        <ClientNavbar />
        <div className="container mt-2">
          {/* -------------------------Button trigger create client modal---------------------------------- */}
          <div className="d-flex flex-row-reverse">
           {pType=="ProjectManager"&&( <>
            <ClientList
                updateClient ={this.updateClient}
                btntxt={clientid==""?"Clients":clientid.split("$")[0]}
              />
            <button
              type="button"
              className=" btn btn-danger btn-sm m-2 ml-4 col-md-1 "
              data-toggle="modal"
              data-target=".bd-example-modal-lg"
            >
              Create Client
            </button>
            </>)}
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
          <ul class="nav nav-pills ml-3 mb-1" id="pills-tab" role="tablist" >
            <li class="nav-item">
              <a
                class="nav-link active"
                id="attachments-tab"
                data-toggle="pill"
                href="#attachments"
                role="tab"
                aria-controls="attachments"
                aria-selected="true"
                onClick={()=>{this.setState({navOn:"attachments"});window.location.reload(false)}}
              >
                Attachments
              </a>
            </li>
            <li class="nav-item"
            >
              <a
                class="nav-link "
                id="forum-tab"
                data-toggle="pill"
                href="#forum"
                role="tab"
                aria-controls="forum"
                aria-selected="false"
                onClick={()=>this.setState({navOn:"forum"})}
              >
                Forum
              </a>
            </li>

            <li class="nav-item">
              <a
                class="nav-link"
                id="upload-tab"
                data-toggle="pill"
                href="#uploaddocument"
                role="tab"
                aria-controls="uploaddocument"
                aria-selected="false"
                onClick={()=>this.setState({navOn:"upload"})}
              >
                Upload Document
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

                     {this.state.loadingModal?
                       (<div style={{float:"left"}}>
                            <GreekingLoader height={"50vh"} />
                       </div> ):
                     ( <div class="container">
                            <div class="row">
                            
                              <div className="col-md-6 mt-4">
                              
                 {navOn=="attachments"&&documentHash.length>0&&(
                                <ClientAttachment 
                                documentHash={documentHash} 
                                setLoading={(loading)=>this.setState({loadingModal:loading})}
                              />)}
                              </div>
                            </div>
                          </div>)}
                     
            </div> 
            <div
              class="tab-pane fade "
              id="forum"
              role="tabpanel"
              aria-labelledby="forum-tab"
            >
              {navOn=="forum"&&clientid&&(<Forum forumFor={"clientChats"} chatid={clientid} chatType="Client" />)}
            </div>

            <div
              class="tab-pane fade "
              id="uploaddocument"
              role="tabpanel"
              aria-labelledby="uploaddocument"
            >
              <div class="col-md-6 mt-4">
                    <form onSubmit={this.handleClientDocUpload}>
                      <div class="form-group files">
                        <input
                          type="file"
                          class="form-control"
                          multiple="true"
                          name="myfile"
                        />
                      </div>
                      <button
                        type="submit"
                        class="float-right btn btn-primary btn-sm"
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
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(ClientDashboard);
