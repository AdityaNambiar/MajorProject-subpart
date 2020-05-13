import React, { Component } from 'react';
import Form from './components/Form';
import DeployStatus from './components/DeployStatus';
import { Route, Switch, Redirect, BrowserRouter } from 'react-router-dom';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
          <Switch>
            <Route path="/deployform" component= { Form } />
            <Route path="/deploystatus" component= { DeployStatus } />
          </Switch>
	  </BrowserRouter>
    );
  }
}

export default App;