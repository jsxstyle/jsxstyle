import generate from '@babel/generator';

import type { ParserPlugin } from '@babel/parser';
import { parse } from '../babelUtils';

// parse helper
const p = (code: string, ...plugins: ParserPlugin[]): string =>
  generate(parse(code, plugins)).code;

// TODO: better examples for Typescript/Flow

it('can parse Typescript', () => {
  const code = `import * as React from 'react';
import { Block } from 'jsxstyle';
export interface ThingProps {
  thing1: string;
  thing2?: boolean;
}
export const Thing: React.FC<ThingProps> = props => <Block />;
ReactDOM.render(<Thing />, (document.getElementById('root') as HTMLElement));`;

  expect(p(code, 'typescript')).toEqual(code);
});

it('can parse Flow', () => {
  const code = `import * as React from 'react';
import { Block } from 'jsxstyle';
type Props = {
  foo: number,
  bar?: ?string,
};
class MyComponent extends React.Component<Props> {
  render() {
    this.props.doesNotExist;
    return <div>{this.props.bar}</div>;
  }
}`;

  expect(p(code, 'flow')).toEqual(code);
});

it('can parse class properties', () => {
  const code = `class Thing {
  state = {};
  wow = p => {};
}`;

  expect(p(code)).toEqual(code);
});
