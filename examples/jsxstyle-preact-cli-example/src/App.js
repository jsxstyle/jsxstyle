import { Component } from 'preact';
import { Router } from 'preact-router';
import { Block } from 'jsxstyle/preact';

import Header from './Header';
import Home from './routes/Home';
import Profile from './routes/Profile';
// import Home from 'async!./home';
// import Profile from 'async!./profile';

import './style.css';

export default class App extends Component {
  /** Gets fired when the route changes.
   *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
   *	@param {string} event.url	The newly routed URL
   */
  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    return (
      <Block height="100%">
        <Header />
        <Router onChange={this.handleRoute}>
          <Home path="/" />
          <Profile path="/profile/" user="me" />
          <Profile path="/profile/:user" />
        </Router>
      </Block>
    );
  }
}
