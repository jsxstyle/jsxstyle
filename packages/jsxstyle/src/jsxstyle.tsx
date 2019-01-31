// tslint:disable max-classes-per-file

import {
  componentStyles,
  CSSProperties,
  DeprecatedJsxstyleComponentName,
  getStyleCache,
  JsxstyleComponentName,
} from 'jsxstyle-utils';
import * as React from 'react';

type IntrinsicElement = keyof JSX.IntrinsicElements;

type ValidComponentPropValue =
  | undefined
  | false
  | null
  | IntrinsicElement
  | React.StatelessComponent<any>
  | React.ComponentClass<any>;

/**
 * A silly way of typing an object with no keys.
 *
 * Empty interfaces in TypeScript seem to be unexpectedly funky.
 * This is the predictable alternative.
 */
interface EmptyProps {
  [propName: string]: never;
}

/**
 * Generic that returns either the extracted props type for a React component
 * or the props type for an IntrinsicElement.
 *
 * If a React component has an empty interface specified as its props type,
 * `ExtractProps` will return an `EmptyProps` interface.
 */
// shout out to https://git.io/fxMvl
// modified to add detection for empty interfaces
type ExtractProps<T extends ValidComponentPropValue> = T extends
  | null
  | false
  | undefined
  ? JSX.IntrinsicElements['div']
  : T extends IntrinsicElement
    ? JSX.IntrinsicElements[T]
    : T extends React.StatelessComponent<infer SFCProps>
      ? keyof SFCProps extends never ? EmptyProps : SFCProps
      : T extends React.ComponentClass<infer ClassProps>
        ? keyof ClassProps extends never ? EmptyProps : ClassProps
        : EmptyProps;

export { CSSProperties };

/** Shared instance of a style cache object. */
export const cache = getStyleCache();

/** Props that will be passed through to whatever component is specified */
export interface StylableComponentProps {
  /** passed as-is through to the underlying component */
  className?: string | null | false;
  /** passed as-is through to the underlying component */
  style?: React.CSSProperties | null | false;
}

/** Common props */
interface SharedProps extends StylableComponentProps, CSSProperties {
  /** An object of media query values keyed by the desired style prop prefix */
  mediaQueries?: Record<string, string>;
}

/** Props for jsxstyle components that have a `component` prop set */
interface JsxstylePropsWithComponent<C extends ValidComponentPropValue>
  extends SharedProps {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component: C;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ExtractProps<C>;
}

/** Props for jsxstyle components that have no `component` prop set */
interface JsxstyleDefaultProps extends SharedProps {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component?: undefined;
  /** Object of props that will be passed down to the underlying div */
  props?: JSX.IntrinsicElements['div'];
}

export type JsxstyleProps<C extends ValidComponentPropValue> =
  | JsxstyleDefaultProps
  | JsxstylePropsWithComponent<C>;

interface JsxstyleComponentState {
  className: string | null;
}

const getDerivedStateFromProps = (props: any) => ({
  className: cache.getClassName(props, props.className),
});

function factory(displayName: JsxstyleComponentName) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  return class<T extends ValidComponentPropValue> extends React.Component<
    JsxstyleProps<T>,
    JsxstyleComponentState
  > {
    constructor(props: JsxstyleProps<T>) {
      super(props);
      // className will be set before initial render with either getDerivedStateFromProps or componentWillMount
      this.state = { className: null };

      const componentWillMount: any = () => {
        this.setState(getDerivedStateFromProps(this.props));
      };

      const componentWillReceiveProps: any = (nextProps: JsxstyleProps<T>) => {
        this.setState(getDerivedStateFromProps(nextProps));
      };

      // In React 16.3+, deprecated lifecycles will not be called if getDerivedStateFromProps is defined.
      // This boolean prevents React from logging the presence of these functions as an error in strict mode.
      // See https://github.com/reactjs/react-lifecycles-compat/blob/0a02b80/index.js#L47
      componentWillMount.__suppressDeprecationWarning = true;
      componentWillReceiveProps.__suppressDeprecationWarning = true;

      this.componentWillMount = componentWillMount;
      this.componentWillReceiveProps = componentWillReceiveProps;
    }

    public static defaultProps = defaultProps;
    public static displayName = displayName;
    public static getDerivedStateFromProps = getDerivedStateFromProps;

    public render() {
      const { props, style, children } = this.props;
      const Component: any = this.props.component || tagName;

      return (
        <Component
          {...props}
          className={this.state.className || undefined}
          style={style || undefined}
        >
          {children}
        </Component>
      );
    }
  };
}

function depFactory(displayName: DeprecatedJsxstyleComponentName) {
  const defaultProps = componentStyles[displayName];
  let hasWarned = false;
  return class<T extends ValidComponentPropValue> extends React.Component<
    JsxstyleProps<T>
  > {
    constructor(props: JsxstyleProps<T>) {
      super(props);
      if (process.env.NODE_ENV !== 'production') {
        if (!hasWarned) {
          hasWarned = true;
          console.error(
            'jsxstyle\u2019s `%s` component is deprecated and will be removed in future versions of jsxstyle.',
            displayName
          );
        }
      }
    }

    public static displayName = displayName;
    public static defaultProps = defaultProps;

    public render() {
      return <Box {...this.props} />;
    }
  };
}

// Using ReturnType + explicit typing to prevent Hella Dupes in the generated types
type JsxstyleComponent = ReturnType<typeof factory>;
type DeprecatedJsxstyleComponent = ReturnType<typeof depFactory>;

export const Box: JsxstyleComponent = factory('Box');
export const Block: JsxstyleComponent = factory('Block');
export const Inline: JsxstyleComponent = factory('Inline');
export const InlineBlock: JsxstyleComponent = factory('InlineBlock');

export const Row: JsxstyleComponent = factory('Row');
export const Col: JsxstyleComponent = factory('Col');
export const InlineRow: JsxstyleComponent = factory('InlineRow');
export const InlineCol: JsxstyleComponent = factory('InlineCol');

export const Grid: JsxstyleComponent = factory('Grid');

// <Box component="table" />
export const Table: DeprecatedJsxstyleComponent = depFactory('Table');
export const TableRow: DeprecatedJsxstyleComponent = depFactory('TableRow');
export const TableCell: DeprecatedJsxstyleComponent = depFactory('TableCell');
// <Row display="inline-flex" />
export const Flex: DeprecatedJsxstyleComponent = depFactory('Flex');
export const InlineFlex: DeprecatedJsxstyleComponent = depFactory('InlineFlex');
