/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import GreekingLoader from "../../loaders/greekingLoader";
import FadeIn from "react-fade-in";
import axios from "axios"
import {ipfsUrl} from "../../utilities/config"
import errorHandle from "../../hooks/errorHandling"
import downloadCard from "../../hooks/downloadCard"
class ClientAttachment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attachments: [],
      loadingModal: false,
    };
    this.handleFileDload = this.handleFileDload.bind(this);
  }

  async componentDidMount() {
    // this.props.setLoading(true);
    let documentHash = this.props.documentHash
    // this.setState({ loadingModal: true });
    
      const {data} = await axios.post(`${ipfsUrl}/readDocument`,{caseDocumentHash:documentHash},{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        }
      })
      
      this.setState({ attachments:data })
      // this.props.setLoading(false);
  }
  handleFileDload = async (e,attachment) => {
    e.preventDefault();
    try{
      const res = await axios.post(`${ipfsUrl}/downloadDocument`,{fileHash:attachment.fileHash},{
        headers:{
          "x-auth-token":localStorage.getItem("x-auth-token")
        },
        responseType:"arraybuffer"
      })
      
      downloadCard(res,`${attachment.name}.${attachment.extension}`)
    }catch(error){
      errorHandle(error);
      window.location.reload()
    }
  };

  render() {
    const attachment = this.state.attachments.map((attachment) => (
      <tr key={attachment.id}>
        <td>
          <a href="#" onClick={(e)=>this.handleFileDload(e,attachment)}>
            {attachment.name}
          </a>
        </td>
        {/* <td>{attachment.fileUploadBy}</td>
        <td>{attachment.fileDate}</td> */}
      </tr>
    ));
    return (
      <div>
         <h5 className="bg bg-warning text-center">
                      Shared Attachments
                    </h5>
                   <table class="table table-striped" style={{overflow:'auto'}}>
              <thead>
                <tr>
                  <th scope="col">File Name</th>
                  {/* <th scope="col">Uploaded By</th>
                  <th scope="col">Date</th> */}
                </tr>
              </thead>
              <tbody>{attachment}</tbody>
            </table>
        
        
      </div>
    );
  }
}

export default ClientAttachment;
