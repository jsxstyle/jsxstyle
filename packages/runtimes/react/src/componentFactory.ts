import { type JsxstyleComponentName, componentStyles } from '@jsxstyle/core';
import { createElement } from 'react';
import { styleCache } from './styleCache.js';
import type { JsxstyleProps, ValidComponentPropValue } from './types.js';

export const classNamePropKey = 'className';

export function componentFactory<T extends JsxstyleComponentName>(
  displayName: T
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: JsxstyleProps<T>
  ): React.ReactElement => {
    const mergedProps = { ...defaultProps, ...props };
    const Component: any = mergedProps.component || tagName;
    const extractedProps = styleCache.getComponentProps(
      mergedProps,
      classNamePropKey
    );
    return createElement(Component, extractedProps);
  };

  component.displayName = displayName;

  return component;
}
