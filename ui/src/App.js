import React, { Component } from 'react';
import Form from './components/Form';
import DeployStatus from './components/DeployStatus';
import DeployDirect from './components/DeployDirect';
import { Route, Switch, BrowserRouter } from 'react-router-dom';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
          <Switch>
            <Route path="/deployform" component= { Form } />
            <Route path="/deploystatus" component= { DeployStatus } />
            <Route path="/deploydirect" component= { DeployDirect } />
          </Switch>
	    </BrowserRouter>
    );
  }
}

export default App;