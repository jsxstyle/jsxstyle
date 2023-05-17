import {
  componentStyles,
  DeprecatedJsxstyleComponentName,
  JsxstyleComponentName,
} from '../../jsxstyle-utils/src';
import { styleCache } from './styleCache';
import type { JsxstyleProps, ValidComponentPropValue } from './types';
import { createElement } from 'react';

export const classNamePropKey = 'className';

export function componentFactory(
  displayName: JsxstyleComponentName | DeprecatedJsxstyleComponentName
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: React.PropsWithChildren<JsxstyleProps<T>>
  ): React.ReactElement => {
    const Component: any = props.component || tagName;
    const extractedProps = styleCache.getComponentProps(
      props,
      classNamePropKey
    );
    return createElement(Component, extractedProps);
  };

  component.displayName = displayName;
  component.defaultProps = defaultProps;

  return component;
}
