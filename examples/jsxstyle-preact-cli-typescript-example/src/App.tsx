import { Block, InlineBlock, JsxstyleProps } from 'jsxstyle/preact';
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

// used for testing
export const InputBox = ({
  value,
  setter,
  ...props
}: {
  value: string;
  setter(value: string): void;
} & JsxstyleProps<{}>) => {
  return (
    <InlineBlock
      component="input"
      padding={4}
      margin={8}
      backgroundColor="white"
      color="black"
      focusOutline="4px solid blue"
      focusPlaceholderColor="#AAAAAA"
      {...props}
      props={{
        ...props?.props,
        value,
        onInput(event: Event) {
          setter((event.target as HTMLInputElement).value);
        },
      }}
    />
  );
};
