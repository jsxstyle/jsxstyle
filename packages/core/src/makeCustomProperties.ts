import { canUseDOM } from './addStyleToHead.js';
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

export interface CustomPropertyVariantWithSetMethod
  extends CustomPropertyVariant {
  activate: () => void;
}

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
  /** Manually enable a variant. Only one variant in this group can be active at a time. */
  setVariant: (variantName: TVariantName | null) => void;
  /** All variant names */
  variantNames: TVariantName[];
  /**
   * Variant metadata keyed by variant name.
   * There’s a curried `set` method in there too.
   */
  variants: Record<TVariantName, CustomPropertyVariantWithSetMethod>;
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
    let overrideElement: Element | null = null;

    const { customProperties, styles, variants, variantNames } =
      generateCustomPropertiesFromVariants(variantMap, buildOptions);

    styles.forEach(cache.insertRule);

    if (canUseDOM) {
      if (buildOptions.selector) {
        overrideElement = document.querySelector(buildOptions.selector);
        if (
          !overrideElement &&
          // @ts-expect-error
          typeof process !== 'undefined' &&
          // @ts-expect-error
          process.env.NODE_ENV !== 'production'
        ) {
          console.error(
            'Selector `%s` does not map to an element that exists in the DOM. Manual variant overrides will not work as expected.',
            buildOptions.selector
          );
        }
      } else {
        overrideElement = document.documentElement;
      }
    }

    const setVariant = (variantName: TVariantName | null): void => {
      if (!overrideElement) return;
      overrideElement.classList.remove(
        ...variantNames.map((key) => variants[key].className)
      );
      if (variantName) {
        overrideElement.classList.add(variants[variantName].className);
      }
    };

    const variantsObj: Record<
      TVariantName,
      CustomPropertyVariantWithSetMethod
    > = {} as any;
    for (const variantName of variantNames) {
      variantsObj[variantName] = {
        ...variants[variantName],
        activate: () => void setVariant(variantName),
      };
    }

    return {
      ...customProperties,
      setVariant,
      variantNames,
      variants: variantsObj,
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
