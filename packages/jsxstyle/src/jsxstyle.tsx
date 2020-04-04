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
  | false
  | null
  | undefined
  | IntrinsicElement
  | React.FunctionComponent<any>
  | React.ComponentClass<any>;

/**
 * Generic that returns either the extracted props type for a React component
 * or the props type for an IntrinsicElement.
 */
// shout out to https://git.io/fxMvl
// modified to add detection for empty interfaces
type ExtractProps<T extends ValidComponentPropValue> = T extends
  | false
  | null
  | undefined
  ? JSX.IntrinsicElements['div']
  : T extends IntrinsicElement
  ? JSX.IntrinsicElements[T]
  : T extends React.FunctionComponent<infer FCProps>
  ? keyof FCProps extends never
    ? {}
    : FCProps
  : T extends React.ComponentClass<infer ClassProps>
  ? keyof ClassProps extends never
    ? {}
    : ClassProps
  : {};

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

function factory(
  displayName: JsxstyleComponentName | DeprecatedJsxstyleComponentName
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: React.PropsWithChildren<JsxstyleProps<T>>
  ): React.ReactElement => {
    const Component: any = props.component || tagName;
    const className = cache.getClassName(props, props.className);
    const componentProps: Record<string, any> = { ...props.props, className };

    if (className) {
      componentProps.className = className;
    }

    if (props.style) {
      componentProps.style = props.style;
    }

    return <Component {...componentProps}>{props.children}</Component>;
  };

  component.displayName = displayName;
  component.defaultProps = defaultProps;

  return component;
}

let depFactory = factory;

if (process.env.NODE_ENV !== 'production') {
  depFactory = function (displayName: DeprecatedJsxstyleComponentName) {
    const defaultProps = componentStyles[displayName];
    let hasWarned = false;

    const component = <T extends ValidComponentPropValue = 'div'>(
      props: React.PropsWithChildren<JsxstyleProps<T>>
    ): React.ReactElement => {
      if (!hasWarned) {
        hasWarned = true;
        console.error(
          'jsxstyle\u2019s `%s` component is deprecated and will be removed in future versions of jsxstyle.',
          displayName
        );
      }
      return <Box {...props} />;
    };

    component.displayName = displayName;
    component.defaultProps = defaultProps;

    return component;
  };
}

// Using ReturnType + explicit typing to prevent Hella Dupes in the generated types
type JsxstyleComponent = ReturnType<typeof factory>;

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
export const Table: JsxstyleComponent = depFactory('Table');
export const TableRow: JsxstyleComponent = depFactory('TableRow');
export const TableCell: JsxstyleComponent = depFactory('TableCell');
// <Row display="inline-flex" />
export const Flex: JsxstyleComponent = depFactory('Flex');
export const InlineFlex: JsxstyleComponent = depFactory('InlineFlex');
