import { createElement } from 'preact';
import {
  type JsxstyleComponentName,
  componentStyles,
} from '../../jsxstyle-utils/src';
import { styleCache } from './styleCache';
import type {
  JsxstyleProps,
  PropsWithChildren,
  ValidComponentPropValue,
} from './types';

export const classNamePropKey = 'class';

export function componentFactory(displayName: JsxstyleComponentName) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: PropsWithChildren<JsxstyleProps<T>>
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
