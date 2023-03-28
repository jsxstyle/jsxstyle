import {
  componentStyles,
  DeprecatedJsxstyleComponentName,
  JsxstyleComponentName,
} from 'jsxstyle/utils/src';
import { styleCache } from './styleCache';
import type { JsxstyleProps, ValidComponentPropValue } from './types';
import { Dynamic, createComponent, mergeProps } from 'solid-js/web';
import type { JSX } from 'solid-js/types';

type Props<T extends ValidComponentPropValue> = JsxstyleProps<T> & {
  children?: JSX.Element;
};

export function componentFactory(
  displayName: JsxstyleComponentName | DeprecatedJsxstyleComponentName
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: Props<T>
  ): JSX.Element => {
    const extractedProps = styleCache.getComponentProps(
      { ...defaultProps, ...props },
      'class'
    );
    return createComponent(
      Dynamic,
      mergeProps(
        {
          get component() {
            return props.component || tagName;
          },
        },
        extractedProps
      )
    );
  };

  return component;
}
