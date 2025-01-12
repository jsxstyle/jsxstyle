import type {
  CommonComponentProp,
  EventHandlerKeys,
  JsxstyleComponentStyleProps,
} from '@jsxstyle/core';
import type { Component, JSX } from 'solid-js';

export type IntrinsicElement = keyof JSX.IntrinsicElements;

export type ValidComponentPropValue = IntrinsicElement | Component;

/**
 * Generic that returns either the extracted props type for a Solid component
 * or the props type for an IntrinsicElement.
 */
// shout out to https://git.io/fxMvl
// modified to add detection for empty interfaces
export type ExtractProps<T extends ValidComponentPropValue> =
  T extends IntrinsicElement
    ? JSX.IntrinsicElements[T]
    : T extends Component<infer FCProps>
      ? keyof FCProps extends never
        ? never
        : FCProps
      : never;

/** Props that will be passed through to whatever component is specified */
export type StylableComponentProps<T extends ValidComponentPropValue> = Pick<
  ExtractProps<T>,
  Extract<keyof ExtractProps<T>, CommonComponentProp | EventHandlerKeys>
>;

/** Props for jsxstyle components */
export type JsxstyleProps<T extends ValidComponentPropValue = 'div'> = {
  /** Component value can be either a Solid component or a tag name string. Defaults to `div`. */
  component?: T | false | null;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ExtractProps<T>;
} & StylableComponentProps<T> &
  JsxstyleComponentStyleProps;
