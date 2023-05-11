import {
  componentStyles,
  DeprecatedJsxstyleComponentName,
  JsxstyleComponentName,
} from '../../jsxstyle-utils/src';
import { styleCache } from './styleCache';
import type {
  PropsWithChildren,
  JsxstyleProps,
  ValidComponentPropValue,
} from './types';
import { createElement } from 'preact';

export function componentFactory(
  displayName: JsxstyleComponentName | DeprecatedJsxstyleComponentName
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: PropsWithChildren<JsxstyleProps<T>>
  ): preact.VNode<any> => {
    const Component: any = props.component || tagName;
    const extractedProps = styleCache.getComponentProps(props, 'class');
    return createElement(Component, extractedProps);
  };

  component.displayName = displayName;
  component.defaultProps = defaultProps;

  return component;
}
