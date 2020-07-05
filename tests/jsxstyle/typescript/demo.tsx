import * as React from 'react';

import { Block } from '../../../packages/jsxstyle';

interface DemoProps {
  demoProp?: boolean;
}

const DemoFC: React.FC<DemoProps> = (props) => <div {...props} />;

interface StyleNumberProps {
  style: number;
}

const StyleNumberFC: React.FC<StyleNumberProps> = () => null;

interface StyleNeverProps {
  style: never;
}

const StyleNeverFC: React.FC<StyleNeverProps> = () => null;

interface NoStyleProps {}

const NoStyleFC: React.FC<NoStyleProps> = () => null;

class DemoClassComponent extends React.Component<DemoProps> {
  public render() {
    return null;
  }
}

export const ValidInputComponent = () => (
  <Block
    component="input"
    props={{
      value: 'wow',
      // @ts-expect-error
      typeError: true,
    }}
  />
);

export const ImplicitDivComponent = () => (
  <>
    <Block
      props={{
        // @ts-expect-error
        typeError: true,
      }}
    />
    <Block
      props={{
        // @ts-expect-error
        tabIndex: 'type error',
      }}
    />
  </>
);

export const FCWithoutProps = () => (
  <>
    <Block
      component={DemoFC}
      props={{
        // @ts-expect-error
        typeError: true,
      }}
    />
    <Block component={DemoFC} props={{ demoProp: true }} />
    <Block
      component={DemoFC}
      props={{
        // @ts-expect-error
        demoProp: 'invalid',
      }}
    />
  </>
);

export const FCWithStyleProps = () => (
  <>
    <Block component={StyleNumberFC} style={1234} />
    {/* @ts-expect-error */}
    <Block component={StyleNumberFC} style={{ width: 1234 }} />
    {React.createElement(Block, { component: StyleNumberFC, style: 'banana' })}
    <Block
      component={StyleNeverFC}
      // @ts-expect-error
      style={1234}
    />
    <Block
      component={NoStyleFC}
      // ideally this would be a type error
      style="hmmmm"
    />
  </>
);

export const ClassComponentWithoutProps = () => (
  <Block
    component={DemoClassComponent}
    props={{
      // @ts-expect-error
      typeError: true,
    }}
  />
);

export const ComponentWithAnimation: React.FC = () => (
  <Block
    animation={{
      from: { opacity: 0 },
      to: {
        opacity: 1,
        // @ts-expect-error
        paddingH: 123,
      },
    }}
    paddingH={30}
    paddingV={60}
  />
);
