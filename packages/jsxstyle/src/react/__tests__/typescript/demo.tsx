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
      // @ts-expect-error extraneous key
      typeError: true,
    }}
  />
);

export const ImplicitDivComponent = () => (
  <>
    <Block
      props={{
        // @ts-expect-error extraneous key
        typeError: true,
      }}
    />
    <Block
      props={{
        // @ts-expect-error this prop type is `number`
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
        // @ts-expect-error extraneous key
        typeError: true,
      }}
    />
    <Block component={DemoFC} props={{ demoProp: true }} />
    <Block
      component={DemoFC}
      props={{
        // @ts-expect-error `demoProp` is an optional boolean
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
      // @ts-expect-error prop type is `never`
      style={1234}
    />
    <Block
      component={NoStyleFC}
      // @ts-expect-error this component does not accept a style prop
      style="hmmmm"
    />
  </>
);

export const ClassComponentWithoutProps = () => (
  <Block
    component={DemoClassComponent}
    props={{
      // @ts-expect-error extraneous key
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
        // @ts-expect-error 'paddingH' does not exist in type 'AnimatableCSSProperties'
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
  /** The color prop is an optional number */
  color?: number;
  requiredProp: Record<string, string>;
}> = () => null;

export const CustomComponent1 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent1',
});

<CustomComponent1 />;

<CustomComponent1
  // @ts-expect-error type is an optional string, not a boolean
  color
/>;

<CustomComponent1
  // @ts-expect-error type is an optional string, not a number
  color={123}
/>;

<CustomComponent1 color="red" />;

export const CustomComponent2 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent2',
  component: ComponentWithOptionalProp,
});

<CustomComponent2 />;

<CustomComponent2
  // @ts-expect-error type is an optional number, not a boolean
  color
/>;

<CustomComponent2
  // @ts-expect-error the `color` prop has not been specified in componentProps, so this should be a style value
  color={123}
/>;

<CustomComponent2
  // this is the correct value for this prop
  color="red"
/>;

export const CustomComponent3 = EXPERIMENTAL_makeComponent({
  displayName: 'CustomComponent3',
  component: ComponentWithOptionalProp,
  componentProps: ['color'],
});

// no color prop is ok... it's optional
<CustomComponent3 />;

<CustomComponent3
  // @ts-expect-error the color prop type is number
  color
/>;

<CustomComponent3
  // this is good
  color={123}
/>;

<CustomComponent3
  // @ts-expect-error this prop type is an optional number, not a string
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
  // @ts-expect-error the definition in customProps should override
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
