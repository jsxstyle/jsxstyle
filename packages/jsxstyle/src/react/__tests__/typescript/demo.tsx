/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
import * as React from 'react';

import { Block, EXPERIMENTAL_makeComponent } from 'jsxstyle';

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
    <Block
      component={StyleNumberFC}
      // @ts-expect-error style is a number
      style={{ width: 1234 }}
    />
    <Block component={StyleNumberFC} style={123} />
    {/* @ts-expect-error not sure what's going on here */}
    {React.createElement(Block, {
      component: StyleNumberFC,
      style: 'banana',
    })}
    {/* @ts-expect-error not sure what's going on here */}
    {React.createElement(Block, {
      component: StyleNumberFC,
      style: 1234,
    })}
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
        // @ts-expect-error
        paddingH: 123,
      },
    }}
    paddingH={30}
    paddingV={60}
  />
);

const ComponentWithOptionalProp: React.FC<{
  /** Comment about component color prop */
  color?: number;
}> = () => null;

const ComponentWithRequiredProp: React.FC<{
  /** Comment about component color prop */
  color?: number;
  requiredProp: Record<string, string>;
}> = () => null;

export const CustomComponent1 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent1',
});

<CustomComponent1 />;

<CustomComponent1
  // @ts-expect-error
  color
/>;

<CustomComponent1
  // @ts-expect-error
  color={123}
/>;

<CustomComponent1 color="red" />;

export const CustomComponent2 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent2',
  component: ComponentWithOptionalProp,
});

<CustomComponent2 />;

<CustomComponent2
  // @ts-expect-error
  color
/>;

<CustomComponent2
  // @ts-expect-error
  color={123}
/>;

<CustomComponent2 color="red" />;

export const CustomComponent3 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent3',
  component: ComponentWithOptionalProp,
  componentProps: ['color'],
});

// @ts-expect-error
<CustomComponent3 />;

<CustomComponent3
  // @ts-expect-error
  color
/>;

<CustomComponent3 color={123} />;

<CustomComponent3
  // @ts-expect-error
  color="red"
/>;

export const CustomComponent4 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent4',
  component: ComponentWithOptionalProp,
  componentProps: ['color'],
  customProps: {
    /** Comment about custom color prop */
    color: (value: boolean) => null,
  },
});

<CustomComponent4 />;

<CustomComponent4 color />;

<CustomComponent4
  // @ts-expect-error
  color={123}
/>;

<CustomComponent4
  // @ts-expect-error
  color="red"
/>;

export const CustomComponent5 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent5',
  component: ComponentWithRequiredProp,
  componentProps: ['color', 'requiredProp'],
  customProps: {
    /** Comment about custom color prop */
    color: (value: boolean) => null,
  },
});

// @ts-expect-error
<CustomComponent5 />;

// @ts-expect-error
<CustomComponent5 color />;

<CustomComponent5 requiredProp={{ hello: 'wow' }} />;

<CustomComponent5
  // @ts-expect-error
  color={123}
/>;

<CustomComponent5
  // @ts-expect-error
  color="red"
/>;
