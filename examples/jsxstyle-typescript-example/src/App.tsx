import * as React from 'react';
import './App.css';
import { Block, InlineBlock } from 'jsxstyle';

const logo = require('./logo.svg');
const width = '100%';
const height = () => 150;

interface LogoProps {
  width: number;
  height: number;
}

const Logo: React.SFC<LogoProps> = props => (
  <InlineBlock
    component="img"
    props={{ src: logo, alt: 'logo' }}
    animation="App-logo-spin infinite 20s linear"
    height={80}
    {...props}
  />
);

class App extends React.Component {
  render() {
    return (
      <Block textAlign="center">
        <Block
          backgroundColor="#222"
          width={width}
          backgroundImage={`url(${logo})`}
          height={height()}
          padding={20}
          color="white"
        >
          <Logo width={80} height={160} />
          <h2>Welcome to React</h2>
        </Block>
        <Block component="p" fontSize="large">
          To get started, edit <code>src/App.tsx</code> and save to reload.
        </Block>
      </Block>
    );
  }
}

export default App;
