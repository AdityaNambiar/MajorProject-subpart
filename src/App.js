import React, { Component } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import "./App.css";
import Login from "../src/components/login";
import Register from "./components/register";
import Dashboard from "./components/dashboard";
import Project from "./components/project";
import PublicProjects from "./components/publicProjects";
import SpecificFile from "./components/specificFile";
import MergeConflict from "./components/mergeConflict";
import CommitDifference from "./components/commitDifference";
import ProjectGraph from "./components/projectGraph";
import ResolveConflicts from "./components/resolveConflicts";

class App extends Component {
  render() {
    return (
      <div>
        <div className="content">
          <Switch>
            <Route
              path="/login"
              render={(props) => (
                <Login {...props} handleToken={this.handleToken} />
              )}
            />
            <Route path="/resolveConflicts" component={ResolveConflicts} />
            <Route path="/projectGraph" component={ProjectGraph} />
            <Route path="/commitDifference" component={CommitDifference} />
            <Route path="/mergeConflict" component={MergeConflict} />
            <Route path="/specificFile" component={SpecificFile} />
            <Route path="/publicProjects" component={PublicProjects} />
            <Route path="/project" component={Project} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/register" component={Register} />
            <Redirect from="/" to="/login" />
            <Redirect to="/not-found" />
          </Switch>
        </div>
      </div>
    );
  }
}

export default App;
