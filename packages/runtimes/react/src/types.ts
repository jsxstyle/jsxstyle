import type {
  CommonComponentProp,
  EventHandlerKeys,
  JsxstyleComponentStyleProps,
} from '@jsxstyle/core';
import type * as React from 'react';

export type IntrinsicElement = keyof React.JSX.IntrinsicElements;

export type ValidComponentPropValue =
  | IntrinsicElement
  | React.FunctionComponent<any>
  | React.ComponentClass<any>;

/**
 * Generic that returns either the extracted props type for a React component
 * or the props type for an IntrinsicElement.
 */
// shout out to https://git.io/fxMvl
// modified to add detection for empty interfaces
export type ExtractProps<T extends ValidComponentPropValue> =
  T extends IntrinsicElement
    ? React.JSX.IntrinsicElements[T]
    : T extends React.FunctionComponent<infer FCProps>
      ? keyof FCProps extends never
        ? never
        : FCProps
      : T extends React.ComponentClass<infer ClassProps>
        ? keyof ClassProps extends never
          ? never
          : ClassProps
        : never;

/** Props that will be passed through to whatever component is specified */
export type StylableComponentProps<T extends ValidComponentPropValue> = Pick<
  ExtractProps<T>,
  Extract<keyof ExtractProps<T>, CommonComponentProp | EventHandlerKeys>
>;

/** Props for jsxstyle components */
export type JsxstyleProps<T extends ValidComponentPropValue = 'div'> = {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component?: T | false | null;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ExtractProps<T>;
} & StylableComponentProps<T> &
  JsxstyleComponentStyleProps;
