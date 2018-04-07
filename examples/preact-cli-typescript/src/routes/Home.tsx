import { h, Component } from 'preact';
import { Block } from 'jsxstyle/preact';

export default class Home extends Component<{}, {}> {
  render() {
    return (
      <Block padding="56px 20px" minHeight="100%" width="100%">
        <h1>Home</h1>
        <p>This is the Home component.</p>
      </Block>
    );
  }
}
