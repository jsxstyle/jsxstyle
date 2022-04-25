import { styleCache } from './styleCache';
import { createElement } from 'react';
import {
  ExtractProps,
  CustomPropsObj,
  ComponentOrIntrinsicElement,
  MakeComponentOptions,
  MakeComponentProps,
  MakeComponentOptionsWithoutCustomProps,
} from './types';

export type { CSSProperties } from '../utils';
export { StylableComponentProps } from './types';
export { styleCache as cache };
export { useMatchMedia } from './useMatchMedia';

const defaultTagName = 'div';

export const makeComponent = <
  P extends ExtractProps<C>,
  K extends keyof P,
  F extends CustomPropsObj,
  C extends ComponentOrIntrinsicElement = 'div'
>({
  component,
  componentProps,
  customProps,
  defaultStyles,
  displayName,
}: MakeComponentOptions<P, K, F, C>) => {
  const allowedProps: Record<string, true> = {};
  if (Array.isArray(componentProps)) {
    for (const propName of componentProps) {
      allowedProps[propName as string] = true;
    }
  }

  const customComponent = (
    props: MakeComponentProps<P, K, F>
  ): React.ReactElement<any, any> => {
    const componentProps: Record<string, any> = {};
    const styleProps: Record<string, any> = {};
    // merging default style props here rather than using `defaultProps` so that the default props don't show up in React dev tools.
    if (defaultStyles) Object.assign(styleProps, defaultStyles);

    // separate component props and style props
    for (const key in props) {
      const value = (props as any)[key];

      if (allowedProps[key]) {
        componentProps[key] = value;
      } else if (key === 'className') {
        // getComponentProps knows what to do with the className prop
        styleProps[key] = value;
      } else {
        const getProp = customProps && customProps[key];
        if (getProp) {
          Object.assign(styleProps, getProp(value));
        } else {
          if (value == null) continue;
          styleProps[key] = value;
        }
      }
    }

    const propsWithClassName = styleCache.getComponentProps(
      styleProps,
      'className'
    );
    if (propsWithClassName) Object.assign(componentProps, propsWithClassName);

    return createElement(
      component || defaultTagName,
      componentProps,
      (props as any).children
    );
  };

  customComponent.displayName = `jsxstyle(${displayName})`;

  /** Create a new component that inherits `customProps` from the parent component */
  customComponent.makeComponent = <
    P2 extends ExtractProps<C2>,
    K2 extends keyof P2,
    C2 extends ComponentOrIntrinsicElement
  >(
    options: MakeComponentOptionsWithoutCustomProps<P2, K2, C2>
  ) =>
    makeComponent<P2, K2, F, C2>({
      ...options,
      displayName: displayName + '.' + options.displayName,
      customProps,
    });

  return customComponent;
};
