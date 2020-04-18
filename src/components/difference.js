import React, { Component } from "react";
//import { withRouter } from "react-router-dom";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import "react-gh-like-diff/dist/css/diff2html.min.css";
//import NavBar from "./navbar";
import CommitHistory from "./commitHistory";
//import FadeIn from "react-fade-in";

class Difference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingModal: false,
      fileArray: this.props.fileArray,
      past: "hii this is gopi",
      current: "hii this is adi",
      pastfname: "gopi",
      currentfname: "gopi",
    };
  }

  //componentWillMount() {
  //this.setState({ loadingModal: true });
  // setTimeout(() => {

  //  }, 3000);
  //}

  handleSaveButton = (e) => {
    e.preventDefault();
  };

  handleMergeButton = (e) => {
    e.preventDefault();
  };
  render() {
    let fileArray = this.state.fileArray;
    let pastfname = this.state.pastfname;
    let currentfname = this.state.currentfname;
    let previousContent = this.state.past;
    let currentContent = this.state.current;
    const conflictedFiles = fileArray.map((file, index) => (
      <tr key={index}>
        <th scope="row">{file.id}</th>
        <td>{file.fileName}</td>
      </tr>
    ));
    return (
      <div>
        {/*  {this.state.loadingModal ? (
          <lottie-player
            src="https://assets3.lottiefiles.com/packages/lf20_rWaqBk.json"
            background="transparent"
            speed="1"
            style={{ width: "1111px", height: "12px" }}
            loop
            autoplay
          ></lottie-player>
        ) : (
          <FadeIn>*/}
        <div className="container">
          <nav className="m-2">
            <div class="nav nav-tabs" id="nav-tab" role="tablist">
              <a
                class="nav-item nav-link active"
                id="conflicted-files-tab"
                data-toggle="tab"
                href="#conflicted-files"
                role="tab"
                aria-controls="conflicted-files"
                aria-selected="true"
              >
                Conflicted Files
              </a>
              <a
                class="nav-item nav-link"
                id="nav-home-tab"
                data-toggle="tab"
                href="#nav-home"
                role="tab"
                aria-controls="nav-home"
                aria-selected="false"
              >
                Conflicts
              </a>
              <a
                class="nav-item nav-link"
                id="nav-profile-tab"
                data-toggle="tab"
                href="#nav-profile"
                role="tab"
                aria-controls="nav-profile"
                aria-selected="false"
              >
                Commit History
              </a>
            </div>
          </nav>
          <div class="tab-content" id="nav-tabContent">
            <div
              class="tab-pane fade show active"
              id="conflicted-files"
              role="tabpanel"
              aria-labelledby="conflicted-files-tab"
            >
              <div className="mt-2" style={{ width: "50%" }}>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">List of Conflicted files</th>
                    </tr>
                  </thead>
                  <tbody>{conflictedFiles}</tbody>
                </table>
              </div>
            </div>
            <div
              class="tab-pane fade mt-2"
              id="nav-home"
              role="tabpanel"
              aria-labelledby="nav-home-tab"
            >
              <ReactGhLikeDiff
                options={{
                  originalFileName: pastfname,
                  updatedFileName: currentfname,
                  fileListToggle: true,
                  outputFormat: "line-by-line",
                  matching: "lines",
                }}
                past={previousContent}
                current={currentContent}
              />
            </div>
            <div
              class="tab-pane fade mt-2"
              id="nav-profile"
              role="tabpanel"
              aria-labelledby="nav-profile-tab"
            >
              <CommitHistory />
            </div>
          </div>
          {/*  <div className="col-lg-3 mx-2"> List of conflicted files</div>
          <div className="col-lg-8 mx-2">
            <div className="row float-right mb-2">
              <button
                className="btn btn-outline-success   mb-2 mr-2 btn-sm"
                onClick={this.handleSaveButton}
              >
                Save
              </button>
              <button
                className="btn btn-success  mb-2 mr-5 btn-sm"
                onClick={this.handleMergeButton}
              >
                Merge (if saved)
              </button>
            </div>
    <br />*/}
        </div>
      </div>
    );
  }
}

export default Difference;
