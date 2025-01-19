import type {
  CustomPropMap,
  GetPropsForVariantMap,
  JsxstyleComponentStyleProps,
} from '@jsxstyle/core';
import { cacheSingleton, makeGetPropsFunction } from '@jsxstyle/core';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import type {
  ExtractProps,
  IntrinsicElement,
  ValidComponentPropValue,
} from './types.js';

type MakeComponentComponentProps<
  TComponent extends ValidComponentPropValue,
  TCustomPropMap extends CustomPropMap,
> = GetPropsForVariantMap<TCustomPropMap> &
  Omit<ExtractProps<TComponent>, keyof TCustomPropMap>;

type CurriedMakeComponent<TCustomPropMap extends CustomPropMap> = (
  defaultStyles: JsxstyleComponentStyleProps | null,
  variants: TCustomPropMap | null
) => ReturnType<typeof makeComponent>;

const makeComponentCache: Record<
  string,
  CurriedMakeComponent<CustomPropMap>
> = {};

export const makeComponent = <
  TComponent extends ValidComponentPropValue,
  TCustomPropMap extends CustomPropMap,
>(
  Component: TComponent,
  defaultStyles: JsxstyleComponentStyleProps | null = null,
  variants: TCustomPropMap | null = null
) => {
  const getProps = makeGetPropsFunction(
    cacheSingleton,
    defaultStyles,
    variants
  );

  const key = `makeComponent(${Component})` as const;
  // biome-ignore lint/style/noNonNullAssertion: `noUncheckedIndexedAccess` is working against us here
  return {
    [key]: (
      props: MakeComponentComponentProps<TComponent, TCustomPropMap>
    ): ReactNode => createElement(Component, getProps(props)),
  }[key]!;
};

const styledFn = new Proxy(makeComponent, {
  get: (target, prop) => {
    if (typeof prop !== 'string') {
      return;
    }

    // Reuse curried makeComponent if it exists
    const cachedFn = makeComponentCache[prop];
    if (cachedFn) {
      return cachedFn;
    }

    const curriedFn = (
      defaultStyles: JsxstyleComponentStyleProps | null,
      variants: CustomPropMap | null
    ) => target(prop as any as IntrinsicElement, defaultStyles, variants);
    makeComponentCache[prop] = curriedFn;
    return curriedFn;
  },
});

export const styled = styledFn as any as (<
  TComponent extends ValidComponentPropValue,
  TCustomPropMap extends CustomPropMap,
>(
  Component: TComponent,
  defaultStyles?: JsxstyleComponentStyleProps | null,
  variants?: TCustomPropMap | null
) => ReturnType<typeof makeComponent<TComponent, TCustomPropMap>>) & {
  [K in IntrinsicElement]: <TCustomPropMap extends CustomPropMap>(
    defaultStyles: JsxstyleComponentStyleProps | null,
    variants: TCustomPropMap | null
  ) => ReturnType<typeof makeComponent<K, TCustomPropMap>>;
};
