import { type JsxstyleComponentName, componentStyles } from '@jsxstyle/core';
import { createMemo } from 'solid-js';
import type { JSX } from 'solid-js';
import { Dynamic, createComponent, mergeProps } from 'solid-js/web';
import { styleCache } from './styleCache.js';
import type { JsxstyleProps, ValidComponentPropValue } from './types.js';

export const classNamePropKey = 'class';

type Props<T extends ValidComponentPropValue> = JsxstyleProps<T> & {
  children?: JSX.Element;
};

export function componentFactory(displayName: JsxstyleComponentName) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  const component = <T extends ValidComponentPropValue = 'div'>(
    props: Props<T>
  ): JSX.Element => {
    const extractedProps = createMemo(() => {
      return styleCache.getComponentProps(
        { ...defaultProps, ...props },
        classNamePropKey
      );
    });

    return createComponent(
      Dynamic,
      mergeProps(
        {
          get component() {
            return props.component || tagName;
          },
        },
        extractedProps()
      )
    );
  };

  return component;
}
