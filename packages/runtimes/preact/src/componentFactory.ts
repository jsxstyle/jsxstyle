import {
  type JsxstyleComponentName,
  componentStyles,
  cacheSingleton,
} from '@jsxstyle/core';
import { createElement } from 'preact';
import type { JsxstyleProps, ValidComponentPropValue } from './types.js';

export const classNamePropKey = 'class';

export function componentFactory<T extends JsxstyleComponentName>(
  displayName: T
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  // biome-ignore lint/style/noNonNullAssertion: we know it's set
  return {
    [displayName]: <T extends ValidComponentPropValue = 'div'>(
      props: JsxstyleProps<T>
    ): preact.VNode<any> => {
      const mergedProps = { ...defaultProps, ...props };
      const Component: any = mergedProps.component || tagName;
      const extractedProps = cacheSingleton.getComponentProps(
        mergedProps,
        classNamePropKey
      );
      return createElement(Component, extractedProps);
    },
  }[displayName]!;
}
