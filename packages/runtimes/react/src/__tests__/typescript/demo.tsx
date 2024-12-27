import * as React from 'react';

import { Block } from '@jsxstyle/react';

interface DemoProps {
  demoProp?: boolean;
}

const DemoFC: React.FC<DemoProps> = (props) => (
  // @ts-expect-error demoProp is not in HTMLDivElement props
  <div {...props} />
);

interface StyleNumberProps {
  style: number;
}

const StyleNumberFC: React.FC<StyleNumberProps> = () => null;

interface StyleNeverProps {
  style: never;
}

const StyleNeverFC: React.FC<StyleNeverProps> = () => null;

interface NoStyleProps {
  children: React.ReactNode;
}

const NoStyleFC: React.FC<NoStyleProps> = () => null;

class DemoClassComponent extends React.Component<DemoProps> {
  public render() {
    return null;
  }
}

export const ValidInputComponent = () => (
  <Block
    component="input"
    className="hello"
    value="wow"
    props={{
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
    <Block
      component={StyleNumberFC}
      // @ts-expect-error style is a number
      style={{ width: 1234 }}
    />
    <Block component={StyleNumberFC} style={123} />
    <Block
      component={StyleNeverFC}
      // @ts-expect-error
      style={1234}
    />
    <Block
      component={NoStyleFC}
      // @ts-expect-error
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
        paddingH: 123,
      },
    }}
    paddingH={30}
    paddingV={60}
  />
);
