import { generateCustomPropertiesFromVariants } from './generateCustomPropertiesFromVariants.js';
import type {
  BuildOptions,
  CustomPropertyVariant,
  CustomPropsObject,
  VariantMap,
} from './generateCustomPropertiesFromVariants.js';
import type { StyleCache } from './getStyleCache.js';
import type { CSSProperties } from './types.js';

export type GetOptionalCustomProperties<
  TCustomProps extends CustomPropsObject,
> = {
  [K in keyof TCustomProps]?: TCustomProps[K] extends string | number
    ? string | number
    : TCustomProps[K] extends CustomPropsObject
      ? GetOptionalCustomProperties<TCustomProps[K]>
      : never;
};

export interface MakeCustomPropertiesFunction<
  TVariantName extends string,
  TCustomProps extends CustomPropsObject,
> {
  /** Add a variant to this variant group */
  addVariant: <TName extends string>(
    /** The name for your new variant. You’ll reference the variant by name when manually activating it. */
    variantName: TName,
    /** The props that will change when this variant is active */
    props: GetOptionalCustomProperties<TCustomProps>,
    /** Options */
    options?: VariantOptions
  ) => MakeCustomPropertiesFunction<TVariantName | TName, TCustomProps>;

  build: (
    buildOptions?: BuildOptions
  ) => BuiltCustomProperties<TVariantName, TCustomProps>;
}

type GetCustomProperties<TCustomProps extends CustomPropsObject> = {
  [K in keyof TCustomProps]: TCustomProps[K] extends string | number
    ? string
    : TCustomProps[K] extends CustomPropsObject
      ? GetCustomProperties<TCustomProps[K]>
      : never;
};

export type BuiltCustomProperties<
  TVariantName extends string,
  TCustomProps extends CustomPropsObject,
> = GetCustomProperties<TCustomProps> & {
  /** All variant names */
  variantNames: TVariantName[];
  /**
   * Variant metadata keyed by variant name.
   * There’s a curried `set` method in there too.
   */
  variants: Record<TVariantName, CustomPropertyVariant>;
  /** All variant styles, one array item per CSS class */
  styles: string[];
};

export interface VariantOptions {
  /** Optional color scheme, to be applied when this variant is applied. */
  colorScheme?: CSSProperties['colorScheme'];
  /** Optional media query that will activate this variant. */
  mediaQuery?: string;
}

const makeCustomPropertiesInternal = <
  TVariantName extends string,
  TCustomProps extends CustomPropsObject,
>(
  variantMap: VariantMap<TVariantName, TCustomProps>,
  cache: StyleCache
): MakeCustomPropertiesFunction<TVariantName, TCustomProps> => ({
  addVariant: (variantName, props, options) => {
    (variantMap as any)[variantName] = { props, options };
    return makeCustomPropertiesInternal(variantMap as any, cache);
  },

  build: (buildOptions = {}) => {
    const { customProperties, styles, variants, variantNames } =
      generateCustomPropertiesFromVariants(variantMap, buildOptions);

    styles.forEach(cache.insertRule);

    return {
      ...customProperties,
      variantNames,
      variants,
      styles,
    };
  },
});

export const getCustomPropertiesFunction =
  (cache: StyleCache) =>
  <TCustomProps extends CustomPropsObject>(
    props: TCustomProps,
    options?: VariantOptions
  ) =>
    makeCustomPropertiesInternal<never, TCustomProps>(
      { default: { props, options } },
      cache
    );
