import React, { Component } from 'react';
import Form from './components/Form';
import DeployStatus from './components/DeployStatus';
import { Route, Switch, Redirect } from 'react-router-dom';

class App extends Component {
  render() {
    return (
      <div>
        <div className="content">
          <Switch>
            <Route path="/deployform" component={Form} />
            <Route path="/deploystatus" component={DeployStatus} />
            <Redirect from="/" to="/home" />
            <Redirect to="/not-found" />
          </Switch>
        </div>
      </div>
    );
  }
}

export default App;