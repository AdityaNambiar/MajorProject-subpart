/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from "react";
import ThreeDotsLoader from "../loaders/threeDotsLoader";
import FadeIn from "react-fade-in";

class ClientAttachment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attachments: [],
      loadingModal: false,
    };
    this.handleFileDload = this.handleFileDload.bind(this);
  }

  componentDidMount() {
    this.setState({ loadingModal: true });
    setTimeout(() => {
      fetch("http://localhost:3000/clientAttachments")
        .then((res) => res.json())
        .then((attachments) =>
          this.setState({ attachments: attachments, loadingModal: false })
        );
    }, 3000);
  }
  handleFileDload = (e) => {
    e.preventDefault();
  };

  render() {
    const attachment = this.state.attachments.map((attachment) => (
      <tr key={attachment.id}>
        <td>
          <a href="#" onClick={this.handleFileDload}>
            {attachment.fileName}
          </a>
        </td>
        <td>{attachment.fileUploadBy}</td>
        <td>{attachment.fileDate}</td>
      </tr>
    ));
    return (
      <div>
        {this.state.loadingModal ? (
          <ThreeDotsLoader height={"300px"} width={"100%"} />
        ) : (
          <FadeIn>
            <table class="table table-striped">
              <thead>
                <tr>
                  <th scope="col">File Name</th>
                  <th scope="col">Uploaded By</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>{attachment}</tbody>
            </table>
          </FadeIn>
        )}
      </div>
    );
  }
}

export default ClientAttachment;
