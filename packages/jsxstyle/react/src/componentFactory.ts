import {
  componentStyles,
  DeprecatedJsxstyleComponentName,
  JsxstyleComponentName,
} from 'jsxstyle/utils/src';
import { styleCache } from './styleCache';
import type { JsxstyleProps, ValidComponentPropValue } from './types';
import * as React from 'react';

export function componentFactory(
  displayName: JsxstyleComponentName | DeprecatedJsxstyleComponentName
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: React.PropsWithChildren<JsxstyleProps<T>>
  ): React.ReactElement => {
    const Component: any = props.component || tagName;
    const extractedProps = styleCache.getComponentProps(props);
    return React.createElement(Component, extractedProps);
  };

  component.displayName = displayName;
  component.defaultProps = defaultProps;

  return component;
}
