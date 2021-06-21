// tslint:disable max-classes-per-file

import {
  componentStyles,
  DeprecatedJsxstyleComponentName,
  JsxstyleComponentName,
} from 'jsxstyle-utils';
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
    const className = styleCache.getClassName(props, props.className);
    const componentProps: Record<string, any> = { ...props.props };

    if (className) {
      componentProps.className = className;
    }

    if (props.style) {
      componentProps.style = props.style;
    }

    return React.createElement(Component, componentProps, props.children);
  };

  component.displayName = displayName;
  component.defaultProps = defaultProps;

  return component;
}
