import { type JsxstyleComponentName, componentStyles } from '@jsxstyle/core';
import { createElement } from 'preact';
import { styleCache } from './styleCache.js';
import type { JsxstyleProps, ValidComponentPropValue } from './types.js';

export const classNamePropKey = 'class';

export function componentFactory<T extends JsxstyleComponentName>(
  displayName: T
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: JsxstyleProps<T>
  ): preact.VNode<any> => {
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
