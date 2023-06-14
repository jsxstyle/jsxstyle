import { Block, InlineBlock } from 'jsxstyle';
import * as React from 'react';
import logo from './logo.svg';
import { exampleClassName } from './styleConstants';

const width = '100%';
const height = () => 150;

interface LogoProps {
  width: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ width, height }) => (
  <InlineBlock
    className="example-classname"
    component="img"
    props={{ src: logo, alt: 'logo' }}
    animation={{
      from: {
        transform: 'rotate(0deg)',
      },
      to: {
        transform: 'rotate(360deg)',
      },
    }}
    animationDuration="20s"
    animationIterationCount="infinite"
    animationTimingFunction="linear"
    height={height || 80}
    width={width}
  />
);

class App extends React.Component {
  public render() {
    return (
      <div className={exampleClassName}>
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
      </div>
    );
  }
}

export default App;
