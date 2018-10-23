import * as React from 'react';
import { Block } from '../../../packages/jsxstyle';

const DemoSFC: React.SFC = props => <div {...props} />;

class DemoClassComponent extends React.Component {
  public render() {
    return null;
  }
}

export const ValidInputComponent = () => (
  <Block component="input" props={{ value: 'wow', typeError: true }} />
);

export const ImplicitDivComponent = () => <Block props={{ typeError: true }} />;

export const SFCWithoutProps = () => (
  <Block component={DemoSFC} props={{ typeError: true }} />
);

export const ClassComponentWithoutProps = () => (
  <Block component={DemoClassComponent} props={{ typeError: true }} />
);
