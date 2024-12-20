import { canUseDOM } from './addStyleToHead.js';
import { generateCustomPropertiesFromVariants } from './generateCustomPropertiesFromVariants.js';
import type {
  BuildOptions,
  CustomPropertyVariant,
  VariantMap,
} from './generateCustomPropertiesFromVariants.js';
import type { StyleCache } from './getStyleCache.js';
import type { CSSProperties } from './types.js';

export interface CustomPropertyVariantWithSetMethod
  extends CustomPropertyVariant {
  activate: () => void;
}

export interface MakeCustomPropertiesFunction<
  KPropKey extends string,
  TVariantName extends string,
> {
  /** Add a variant to this variant group */
  addVariant: <TName extends string>(
    /** The name for your new variant. You’ll reference the variant by name when manually activating it. */
    variantName: TName,
    /** The props that will change when this variant is active */
    props: {
      [Key in KPropKey]?: string | number;
    } & {
      /** An optional media query that will activate this variant */
      mediaQuery?: string;
      /** An optional `color-scheme` that will be set for this variant */
      colorScheme?: CSSProperties['colorScheme'];
    }
  ) => MakeCustomPropertiesFunction<KPropKey, TVariantName | TName>;

  build: (
    buildOptions?: BuildOptions
  ) => BuiltCustomProperties<KPropKey, TVariantName>;
}

export type BuiltCustomProperties<
  KPropKey extends string,
  TVariantName extends string,
> = {
  [Key in Exclude<
    KPropKey,
    'setVariant' | 'variantNames' | 'variants' | 'styles'
  >]: string;
} & {
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

const makeCustomPropertiesInternal = <
  KPropKey extends string,
  TVariantName extends string,
>(
  variantMap: VariantMap<TVariantName, KPropKey>,
  cache: StyleCache
): MakeCustomPropertiesFunction<KPropKey, TVariantName> => ({
  addVariant: <TName extends string>(
    variantName: TName,
    props: {
      [Key in KPropKey]?: string | number;
    } & {
      /** An optional media query that will activate this variant */
      mediaQuery?: string;
      /** An optional `color-scheme` that will be set for this variant */
      colorScheme?: CSSProperties['colorScheme'];
    }
  ) => {
    (variantMap as any)[variantName] = props;
    return makeCustomPropertiesInternal<KPropKey, TVariantName | TName>(
      variantMap as any,
      cache
    );
  },

  build: (buildOptions: BuildOptions = {}) => {
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
  <KPropKeys extends string>(props: Record<KPropKeys, string | number>) =>
    makeCustomPropertiesInternal({ default: props }, cache);
