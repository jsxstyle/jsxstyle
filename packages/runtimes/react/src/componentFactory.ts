'use client';

import { type JsxstyleComponentName, componentStyles } from '@jsxstyle/core';
import { createElement, useContext } from 'react';
import { JsxstyleCacheContext } from './JsxstyleCacheProvider.js';
import type { JsxstyleProps, ValidComponentPropValue } from './types.js';

const classNamePropKey = 'className';

export function componentFactory<T extends JsxstyleComponentName>(
  displayName: T
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  // biome-ignore lint/style/noNonNullAssertion: we know it's set
  return {
    // this sets Function.name
    [displayName]: <T extends ValidComponentPropValue = 'div'>(
      props: JsxstyleProps<T>
    ): React.ReactElement => {
      const cache = useContext(JsxstyleCacheContext);
      const mergedProps = { ...defaultProps, ...props };
      const Component: any = mergedProps.component || tagName;
      const extractedProps = cache.getComponentProps(
        mergedProps,
        classNamePropKey
      );
      return createElement(Component, extractedProps);
    },
  }[displayName]!;
}
