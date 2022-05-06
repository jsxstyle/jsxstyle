import { Block } from 'jsxstyle/preact';
import { Component, h } from 'preact';

export default class Home extends Component<{ path: string }> {
  public render() {
    return (
      <Block padding="56px 20px" minHeight="100%" width="100%">
        <h1>Home</h1>
        <p>This is the Home component.</p>
      </Block>
    );
  }
}
