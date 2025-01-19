import { parseStyleProp } from './parseStyleProp.js';
import type { ParsedStyleProp } from './parseStyleProp.js';

/** Props that are used internally and not passed on to the underlying component */
const skippedProps = new Set(['component', 'mediaQueries', 'props']);

export interface ParseStylePropsOutput {
  parsedStyleProps: Record<string, ParsedStyleProp>;
  componentProps: Record<string, unknown>;
}

export const parseStyleProps = (
  /** An object of jsxstyle component props */
  props: Record<string, any>,
  /** String containing one or more `&` symbols */
  ampersandString?: string,
  /** String that starts with `"@media "` */
  queryString?: string
): ParseStylePropsOutput => {
  const componentProps: Record<string, unknown> =
    typeof props.props === 'object' ? { ...props.props } : {};

  const parsedStyleProps: Record<string, ParsedStyleProp> = {};
  for (const propName in props) {
    if (skippedProps.has(propName)) {
      continue;
    }
    const propValue = props[propName];

    const result = parseStyleProp(
      propName,
      propValue,
      ampersandString,
      queryString
    );
    if (result?.type === 'styleProp') {
      Object.assign(parsedStyleProps, result.parsedStyleProps);
    } else if (result?.type === 'componentProp') {
      componentProps[result.key] = result.value;
    }
  }
  return {
    parsedStyleProps,
    componentProps,
  };
};
