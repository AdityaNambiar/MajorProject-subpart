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
import CommitDifference from "./components/diff2htmlUi"
import ProjectGraph from "./components/projectGraph";
import ResolveConflicts from "./components/resolveConflicts";
import Discussion from "./components/discussions"
import ClientDashboard from "./components/client/clientDashboard";
import ClientLogin from "./components/client/clientLogin";
import Home from "./components/home";
import Pulls from "./components/pulls"
import pulls from "./components/pulls";
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
            <Route path="/discussions" component={Discussion} />
            <Route path="/clientDashboard" component={ClientDashboard} />
            <Route path="/clientLogin" component={ClientLogin} />
            <Route path="/pulls" component={pulls} />
            <Route path="/home" component={Home} />
            <Redirect from="/" to="/home" />
            <Redirect to="/not-found" />
          </Switch>
        </div>
      </div>
    );
  }
}

export default App;
