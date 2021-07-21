import { CSSProperties, ComponentProp } from 'jsxstyle-utils';

export type IntrinsicElement = keyof JSX.IntrinsicElements;

export type ValidComponentPropValue =
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
export type ExtractProps<T extends ValidComponentPropValue> = T extends
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

/** Props that will be passed through to whatever component is specified */
export type StylableComponentProps<T extends ValidComponentPropValue> = Pick<
  ExtractProps<T>,
  Extract<keyof ExtractProps<T>, ComponentProp>
>;

/** Common props */
interface SharedProps extends CSSProperties {
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

export type JsxstyleProps<T extends ValidComponentPropValue = 'div'> = (
  | JsxstyleDefaultProps
  | JsxstylePropsWithComponent<T>
) &
  StylableComponentProps<T>;
