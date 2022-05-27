import * as React from 'react';
import { Block } from 'jsxstyle';

const TestComponent: React.FC<{
  /** Test comment */
  onClick: number;
  onMouseDown?: string;
  onWhatever?: number;
}> = () => null;

<Block onClick={() => {}} color="red" />;

<Block
  // @ts-expect-error
  onClick={123}
  color="red"
/>;

<Block
  component={TestComponent}
  // @ts-expect-error onClick is specified as a number in TestComponent
  onClick={() => {}}
  color="red"
/>;

<Block component={TestComponent} onClick={123} color="red" />;

// @ts-expect-error onClick is a required prop
<Block component={TestComponent} color="red" />;

<Block
  component={TestComponent}
  onClick={123}
  onMouseDown="wow"
  onWhatever={123}
  color="red"
/>;
