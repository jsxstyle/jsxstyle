import type {
  CustomPropMap,
  GetPropsForVariantMap,
  JsxstyleComponentStyleProps,
} from '@jsxstyle/core';
import { cacheSingleton, makeGetPropsFunction } from '@jsxstyle/core';
import { createElement } from 'react';

type MakeComponentComponentProps<
  K extends keyof JSX.IntrinsicElements,
  TCustomPropMap extends CustomPropMap,
> = GetPropsForVariantMap<TCustomPropMap> & JSX.IntrinsicElements[K];

export const makeComponent = <
  K extends keyof JSX.IntrinsicElements,
  TCustomPropMap extends CustomPropMap,
>(
  Component: K,
  defaultStyles: JsxstyleComponentStyleProps | null = null,
  variants: TCustomPropMap | null = null
) => {
  const getProps = makeGetPropsFunction(
    cacheSingleton,
    defaultStyles,
    variants
  );

  return (props: MakeComponentComponentProps<K, TCustomPropMap>) =>
    createElement(Component, getProps(props));
};
