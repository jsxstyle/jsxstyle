import { Block } from 'jsxstyle/preact';
import { Component, h } from 'preact';
import { Router } from 'preact-router';

import Header from './Header';
import Home from './routes/Home';
import Profile from './routes/Profile';

import './style.css';

export default class App extends Component<{}, {}> {
  public render() {
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
