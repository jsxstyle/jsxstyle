import { h, Component } from 'preact';
import { Router } from 'preact-router';
import { Block } from 'jsxstyle/preact';

import Header from './Header';
import Home from './routes/Home';
import Profile from './routes/Profile';

import './style.css';

export default class App extends Component<{}, {}> {
  render() {
    return (
      <Block height="100%">
        <Header />
        <Router>
          <Home path="/" />
          <Profile path="/profile/" user="me" />
          <Profile path="/profile/:user" />
        </Router>
      </Block>
    );
  }
}
