import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import NavBar from "./navbar";
import FadeIn from "react-fade-in";
import Spinner from "./../Utils/spinner";
import Difference from "./difference";

class MergeConflict extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fileArray: [],
      loadingModal: false,
      dloading: false,
      ploading: false,
      errorMessage:
        "Proident excepteur reprehenderit elit sint reprehenderit in esse ex deserunt ullamco ut aute enim esse. Voluptate qui velit incididunt veniam et Lorem do ipsum duis. Aute commodo in aliquip fugiat consequat dolore velit. In ex sunt ad in. Et mollit aliquip sit reprehenderit dolor minim eiusmod amet reprehenderit id cupidatat enim ea pariatur. Id nostrud consequat nostrud eiusmod irure sunt adipisicing. Enim exercitation ad in sit ea tempor aliquip culpa.",
    };
    this.handlePushButton = this.handlePushButton.bind(this);
    this.handleDloadRepo = this.handleDloadRepo.bind(this);
    this.handleResolveConflictButton = this.handleResolveConflictButton.bind(
      this
    );
  }

  handlePushButton = (e) => {
    e.preventDefault();
    this.setState({ ploading: true });
    setTimeout(() => {
      this.setState({ ploading: false });
    }, 3000);
  };

  handleDloadRepo = (e) => {
    e.preventDefault();
    this.setState({ dloading: true });
    setTimeout(() => {
      this.setState({ dloading: false });
    }, 3000);
  };

  componentWillMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/fileArray")
        .then((res) => res.json())
        .then((fileArray) =>
          this.setState({ fileArray: fileArray, loadingModal: false })
        );
    }, 3000);
  }

  handleResolveConflictButton = (e) => {
    e.preventDefault();
    let fileArray = this.state.fileArray;
    this.props.history.push("./resolveConflicts", { fileArray: fileArray });
  };

  render() {
    // const conflictedFiles = this.state.fileArray.map((file, index) => (
    //   <tr key={index}>
    //     <th scope="row">{file.id}</th>
    //     <td>{file.fileName}</td>
    //   </tr>
    // ));
    return (
      <div>
        <NavBar />
        <div className="container">
          {this.state.loadingModal ? (
            <lottie-player
              src="https://assets3.lottiefiles.com/packages/lf20_rWaqBk.json"
              background="transparent"
              speed="1"
              style={{ width: "1111px", height: "12px" }}
              loop
              autoplay
            ></lottie-player>
          ) : (
            <FadeIn>
              <div className="text-right">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm  m-4"
                  onClick={this.handleResolveConflictButton}
                >
                  Resolve Conflicts
                </button>
              </div>

              <Difference fileArray={this.state.fileArray} />
              <hr />
              <form>
                <div className="form-group">
                  <label for="exampleFormControlTextarea1">
                    Error message:
                  </label>
                  <textarea
                    className="form-control"
                    id="exampleFormControlTextarea1"
                    rows="5"
                    disabled
                  >
                    {this.state.errorMessage}
                  </textarea>
                  <div className="text-center">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm m-2"
                      onClick={this.handleDloadRepo}
                    >
                      {this.state.dloading && (
                        <span>
                          Downloading <Spinner />
                        </span>
                      )}
                      {!this.state.dloading && <span>Download Repository</span>}
                    </button>
                  </div>
                </div>
              </form>
              <div className="text-center">
                <button
                  type="submit"
                  className="btn btn-warning btn-sm m-2"
                  onClick={this.handlePushButton}
                >
                  {this.state.ploading && (
                    <span>
                      Confirming <Spinner />
                    </span>
                  )}
                  {!this.state.ploading && <span>Push</span>}
                </button>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(MergeConflict);
