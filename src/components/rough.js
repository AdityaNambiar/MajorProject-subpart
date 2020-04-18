import React, { Component } from "react";
import Spinner from "./../Utils/spinner";
class Rough extends Component {
  state = {
    cmloading: false,
  };

  render() {
    return (
      <div>
        <button
          type="button"
          class="btn btn-primary"
          data-toggle="modal"
          data-target="#commit"
        >
          Commit
        </button>
        <div
          class="modal fade"
          id="commit"
          tabindex="-1"
          role="dialog"
          aria-labelledby="commitLabel"
          aria-hidden="true"
        >
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="commitLabel">
                  Commit Details
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
              <div class="modal-body">
                <form>
                  <div class="form-group">
                    <label for="formGroupExampleInput">Commit Message</label>
                    <input
                      type="text"
                      class="form-control"
                      id="formGroupExampleInput"
                      placeholder="Example input placeholder"
                    />
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-success btn-sm">
                  {this.state.cmloading && (
                    <small>
                      Committing <Spinner />
                    </small>
                  )}
                  {!this.state.cmloading && <small>Commit</small>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Rough;
