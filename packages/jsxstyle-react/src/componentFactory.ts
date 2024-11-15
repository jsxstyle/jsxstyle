import { createElement } from 'react';
import {
  type JsxstyleComponentName,
  componentStyles,
} from '../../jsxstyle-utils/src';
import { styleCache } from './styleCache';
import type { JsxstyleProps, ValidComponentPropValue } from './types';

export const classNamePropKey = 'className';

export function componentFactory(displayName: JsxstyleComponentName) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: React.PropsWithChildren<JsxstyleProps<T>>
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
