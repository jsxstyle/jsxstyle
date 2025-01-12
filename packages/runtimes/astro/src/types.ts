import type {
  CommonComponentProp,
  EventHandlerKeys,
  JsxstyleComponentStyleProps,
} from '@jsxstyle/core';

export type IntrinsicElement = keyof astroHTML.JSX.IntrinsicElements;

export type ValidComponentPropValue = IntrinsicElement;

/** Props that will be passed through to whatever component is specified */
export type StylableComponentProps<T extends ValidComponentPropValue> = Pick<
  astroHTML.JSX.IntrinsicElements[T],
  Extract<
    keyof astroHTML.JSX.IntrinsicElements[T],
    CommonComponentProp | EventHandlerKeys
  >
>;

/** Props for jsxstyle components */
export type JsxstyleProps<K extends ValidComponentPropValue = 'div'> = {
  /** Component value is a tag name string. Defaults to `div`. */
  component?: K | false | null;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: astroHTML.JSX.IntrinsicElements[K];
} & StylableComponentProps<K> &
  JsxstyleComponentStyleProps;
