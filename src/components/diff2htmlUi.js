import React from "react";
import NavBar from "./navbar";
import { withRouter } from "react-router-dom";
import FadeIn from "react-fade-in";
import Barloader from "../loaders/barLoader";
import axios from "axios";
import {url} from "../utilities/config"
const errorHandle = require("../hooks/errorHandling")
class Diff2HtmlUi extends React.Component {
  state = {
    compareType: "single",
    diffString: null,
    loadingModal:null
  };

  renderDiff = async () => {
    const { diffString, compareType } = this.state;
    const ouputFormat = compareType === "single" ? false : compareType;
    const targetElement = this.refs.myDiffElement;
    const configuration = {
      inputFormat: "json",
      drawFileList: true,
      matching: "lines",
      highlight: true,
      outputFormat: ouputFormat,
      synchronisedScroll:true
    };
   
    const diff2htmlUi = await new global.Diff2HtmlUI(
      targetElement,
      diffString,
      configuration
    );
    diff2htmlUi.draw();
    diff2htmlUi.highlightCode();
    diff2htmlUi.fileListToggle(false);
  };


  componentWillMount = async () => {
    try{
      this.setState({loadingModal:true})
      const {projectid,commitHash} = this.props.location.state;
      console.log(projectid,commitHash,localStorage.getItem(projectid))
       let body = {
         "projectid":projectid,
         "operation":"DIFFFORCOMMIT",
         "branchToUpdate":localStorage.getItem(projectid),
         "ref1":commitHash
       }
       const {data} = await axios.post(`${url}/checkAccess`,body,{
         headers:{
           'x-auth-token':localStorage.getItem("x-auth-token")
         }
       });
       let diffString = Buffer.from(data.diffOutput.data).toString()
       this.setState({ diffString: diffString,loadingModal:false });
     }catch(error){
       errorHandle(error);
       this.setState({loadingModal:false})
     }
    
    this.renderDiff();
  };
  componentDidUpdate = (prevProps,prevState) => {
    
    if(prevState.compareType!==this.state.compareType){
      this.renderDiff();
    }
  };

  render() {
    document.addEventListener(
      "click",
      function(e) {
        var target = e.target;

        while (target && target.tagName !== "A") {
          target = target.parentNode;
          if (!target) {
            return;
          }
        }
        let href = target.href;
        if (target.href.match("#")) {
          e.preventDefault();
          let jump = href.split("#")[1];
          console.log(jump)
         try{
          document.getElementById(jump).scrollIntoView();
         }catch(error){

         }
          return;
        }
      },
      false
    );
 
    return (
      
        
        <div className="container-fluid">
          <NavBar/>

        {this.state.loadingModal?(
          <Barloader height={"12px"} width={"1340px"} />
        ):(
            
          <div>
          {this.state.diffString&&(<div>
            <select onChange={e => this.setState({ compareType: e.target.value })}>
                <option value="single">Single</option>
                <option value="side-by-side">Side by Side</option>
            </select>
            </div> )
            }
          <div ref="myDiffElement"> </div> 
          </div>

        )}

        </div> 
     
    );
  }
}

export default Diff2HtmlUi;
