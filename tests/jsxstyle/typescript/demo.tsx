import * as React from 'react';

import { Block } from '../../../packages/jsxstyle';

interface DemoProps {
  demoProp?: boolean;
}

const DemoFC: React.FC<DemoProps> = (props) => <div {...props} />;

class DemoClassComponent extends React.Component<DemoProps> {
  public render() {
    return null;
  }
}

export const ValidInputComponent = () => (
  <Block component="input" props={{ value: 'wow', typeError: true }} />
);

export const ImplicitDivComponent = () => (
  <>
    <Block props={{ typeError: true }} />
    <Block props={{ tabIndex: 'type error' }} />
  </>
);

export const FCWithoutProps = () => (
  <>
    <Block component={DemoFC} props={{ typeError: true }} />
    {/* not a type error, just a sanity check */}
    <Block component={DemoFC} props={{ demoProp: true }} />
    <Block component={DemoFC} props={{ demoProp: 'invalid' }} />
  </>
);

export const ClassComponentWithoutProps = () => (
  <Block component={DemoClassComponent} props={{ typeError: true }} />
);

export const ComponentWithAnimation: React.FC = () => (
  <Block
    animation={{
      from: { opacity: 0 },
      to: { opacity: 1, paddingH: 123 },
    }}
    paddingH={30}
    paddingV={60}
  />
);
