import {
  type JsxstyleComponentName,
  cacheSingleton,
  componentStyles,
} from '@jsxstyle/core';
import { createMemo } from 'solid-js';
import type { JSX } from 'solid-js';
import { Dynamic, createComponent, mergeProps } from 'solid-js/web';
import type { JsxstyleProps, ValidComponentPropValue } from './types.js';

const classNamePropKey = 'class';

export function componentFactory<T extends JsxstyleComponentName>(
  displayName: T
) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  // oxlint-disable-next-line typescript/no-non-null-assertion -- we know it's set
  return {
    [displayName]: <T extends ValidComponentPropValue = 'div'>(
      props: JsxstyleProps<T>
    ): JSX.Element => {
      const extractedProps = createMemo(() => {
        return cacheSingleton.getComponentProps(
          { ...defaultProps, ...props },
          classNamePropKey
        );
      });

      return createComponent(
        Dynamic,
        // `as any`: extractedProps() carries an unknown-valued index signature
        // that widens `component` past Dynamic's typing
        mergeProps(
          {
            get component() {
              return props.component || tagName;
            },
          },
          extractedProps()
        ) as any
      );
    },
  }[displayName]!;
}
