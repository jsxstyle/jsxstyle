import type { CSSProperties, CommonComponentProp } from '../utils';
import type * as React from 'react';

export type IntrinsicElement = keyof JSX.IntrinsicElements;

export type ComponentOrIntrinsicElement =
  | IntrinsicElement
  | ((props: any) => React.ReactElement<any, any> | null)
  | React.ComponentClass<any>;

export type ValidComponentPropValue =
  | false
  | null
  | undefined
  | ComponentOrIntrinsicElement;

type CommonReactComponentProp = 'className' | CommonComponentProp;

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
  : T extends (props: infer FCProps) => React.ReactElement<any, any> | null
  ? keyof FCProps extends never
    ? Record<string, unknown>
    : FCProps
  : T extends React.ComponentClass<infer ClassProps>
  ? keyof ClassProps extends never
    ? Record<string, unknown>
    : ClassProps
  : Record<string, unknown>;

// prettier-ignore
type UpperCaseLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

/** Generic that extracts the keys of event handlers from an object of props. */
type EventHandlerKeys<T> = Extract<keyof T, `on${UpperCaseLetter}${string}`>;

/** Props that will be passed through to whatever component is specified */
// export interface StylableComponentProps<T extends ValidComponentPropValue>
//   extends Falsey<Pick<ExtractProps<T>, 'className' | 'style'>> {};

/** Props that will be passed through to whatever component is specified */
export type StylableComponentProps<T extends ValidComponentPropValue> = Pick<
  ExtractProps<T>,
  Extract<
    keyof ExtractProps<T>,
    CommonReactComponentProp | EventHandlerKeys<ExtractProps<T>>
  >
>;

/** Props for jsxstyle components that have a `component` prop set */
interface JsxstylePropsWithComponent<C extends ValidComponentPropValue> {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component: C;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ExtractProps<C>;
}

/** Props for jsxstyle components that have no `component` prop set */
interface JsxstyleDefaultProps {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component?: undefined;
  /** Object of props that will be passed down to the underlying div */
  props?: JSX.IntrinsicElements['div'];
}

export type JsxstyleProps<T extends ValidComponentPropValue = 'div'> = (
  | JsxstyleDefaultProps
  | JsxstylePropsWithComponent<T>
) &
  StylableComponentProps<T> &
  CSSProperties;

export type CustomPropsObj = Record<
  string,
  (value: any) => CSSProperties | null
>;

/** Props that should be allowed on a `makeComponent` component */
type DefaultProp = 'children';

export type MakeComponentProps<
  P extends Record<string, any>,
  K extends keyof P,
  F extends CustomPropsObj
> = {
  // CSS properties that don't collide with customProps or componentProps
  [K1 in Exclude<
    keyof CSSProperties,
    K | keyof F | DefaultProp
  >]: CSSProperties[K1];
} & {
  // componentProps that don't collide with default props or style props
  [K1 in Exclude<K, keyof F | DefaultProp>]: P[K1];
} & {
  // customProps that don't collide with componentProps
  [K1 in keyof F]?: Parameters<F[K1]>[0];
} & Pick<P, DefaultProp>;

export interface MakeComponentOptionsWithoutCustomProps<
  P extends ExtractProps<C>,
  K extends keyof P,
  C extends ComponentOrIntrinsicElement
> {
  component?: C;
  componentProps?: K[];
  defaultStyles?: CSSProperties | null;
  displayName: string;
}

export interface MakeComponentOptions<
  P extends ExtractProps<C>,
  K extends keyof P,
  F extends CustomPropsObj,
  C extends ComponentOrIntrinsicElement
> extends MakeComponentOptionsWithoutCustomProps<P, K, C> {
  customProps?: F;
}
