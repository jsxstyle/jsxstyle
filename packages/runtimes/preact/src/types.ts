import type {
  CSSProperties,
  CommonComponentProp,
  EventHandlerKeys,
} from '@jsxstyle/core';
import type { JSX } from 'preact';

export type IntrinsicElement = keyof JSX.IntrinsicElements;

export type ValidComponentPropValue =
  | IntrinsicElement
  | preact.FunctionComponent<any>
  | preact.ComponentClass<any>;

/**
 * Generic that returns either the extracted props type for a Preact component
 * or the props type for an IntrinsicElement.
 */
// shout out to https://git.io/fxMvl
// modified to add detection for empty interfaces
export type ExtractProps<T extends ValidComponentPropValue> =
  T extends IntrinsicElement
    ? JSX.IntrinsicElements[T]
    : T extends preact.FunctionComponent<infer FCProps>
      ? keyof FCProps extends never
        ? never
        : FCProps
      : T extends preact.ComponentClass<infer ClassProps>
        ? keyof ClassProps extends never
          ? never
          : ClassProps
        : never;

/** Props that will be passed through to whatever component is specified */
export type StylableComponentProps<T extends ValidComponentPropValue> = Pick<
  ExtractProps<T>,
  Extract<keyof ExtractProps<T>, CommonComponentProp | EventHandlerKeys>
>;

/** Props for jsxstyle components that have a `component` prop set */
export type JsxstyleProps<T extends ValidComponentPropValue = 'div'> = {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component?: T | false | null | undefined;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ExtractProps<T>;
} & StylableComponentProps<T> &
  CSSProperties;
