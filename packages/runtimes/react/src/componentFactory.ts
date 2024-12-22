import {
  type JsxstyleComponentName,
  componentStyles,
  cacheSingleton,
} from '@jsxstyle/core';
import { createElement } from 'react';
import type { JsxstyleProps, ValidComponentPropValue } from './types.js';

export const classNamePropKey = 'className';

export function componentFactory<T extends JsxstyleComponentName>(
  displayName: T
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  // biome-ignore lint/style/noNonNullAssertion: we know it's set
  return {
    // this sets Function.name
    [displayName]: <T extends ValidComponentPropValue = 'div'>(
      props: JsxstyleProps<T>
    ): React.ReactElement => {
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
