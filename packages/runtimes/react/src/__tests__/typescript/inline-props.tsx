import { Block } from '@jsxstyle/react';
import type * as React from 'react';

const TestComponent: React.FC<{
  /** Test comment */
  value: Record<string, number>;
}> = () => null;

<Block
  // @ts-expect-error divs don't accept value props
  value="ok"
  color="red"
/>;

<Block component="input" value="ok" color="red" marginH={20} />;

<Block
  component="input"
  // @ts-expect-error inputs don't accept object-type value props
  value={{}}
  color="red"
/>;

<Block component={TestComponent} value={{ hello: 123 }} color="red" />;

<Block
  component={TestComponent}
  value={{
    // @ts-expect-error TestComponent expects an object
    hello: 'abc',
  }}
  color="red"
/>;

<Block
  component={TestComponent}
  // @ts-expect-error value is not a string type
  value="hello"
  color="red"
/>;

// @ts-expect-error value is a required prop
<Block component={TestComponent} color="red" />;
