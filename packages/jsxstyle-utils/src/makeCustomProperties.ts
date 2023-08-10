import type { StyleCache } from './getStyleCache';
import { canUseDOM } from './addStyleToHead';
import {
  type BuildOptions,
  type VariantMap,
  generateCustomPropertiesFromVariants,
} from './generateCustomPropertiesFromVariants';

const makeCustomPropertiesInternal = <
  KPropKey extends string,
  TVariantName extends string
>(
  variantMap: VariantMap<TVariantName, KPropKey>,
  cache: StyleCache
) => ({
  addVariant: <TName extends string>(
    variantName: TName,
    props: {
      [Key in KPropKey]?: string | number;
    } & {
      /** An optional media query that will activate this variant */
      mediaQuery?: string;
    }
  ) => {
    (variantMap as any)[variantName] = props;
    return makeCustomPropertiesInternal<KPropKey, TVariantName | TName>(
      variantMap as any,
      cache
    );
  },

  build: (
    buildOptions: BuildOptions = {}
  ): {
    setVariant: (variantName: TVariantName | null) => void;
    variants: readonly TVariantName[];
  } & {
    [K in KPropKey]: string;
  } & {
    [K in TVariantName as `activate${Capitalize<K>}`]: () => void;
  } => {
    let overrideElement: Element | null = null;

    const { customProperties, overrideClasses, styles, variantNames } =
      generateCustomPropertiesFromVariants(variantMap, buildOptions);

    styles.forEach(cache.insertRule);

    if (canUseDOM) {
      if (buildOptions.selector) {
        overrideElement = document.querySelector(buildOptions.selector);
        if (!overrideElement && process.env.NODE_ENV !== 'production') {
          console.error(
            'Selector `%s` does not map to an element that exists in the DOM. Manual variant overrides will not work as expected.'
          );
        }
      } else {
        overrideElement = document.documentElement;
      }
    }

    const setVariant = (variantName: TVariantName | null): void => {
      if (!overrideElement) return;
      overrideElement.classList.remove(
        ...variantNames.map((key) => overrideClasses[key])
      );
      if (variantName) {
        overrideElement.classList.add(overrideClasses[variantName]);
      }
    };

    const returnValue: Record<string, any> = { ...customProperties };
    for (const variantName of variantNames) {
      returnValue[
        `activate${variantName[0].toUpperCase()}${variantName.slice(1)}`
      ] = () => void setVariant(variantName);
    }

    returnValue.setVariant = setVariant;
    returnValue.variants = variantNames;

    return returnValue as any;
  },
});

export const getCustomPropertiesFunction =
  (cache: StyleCache) =>
  <KPropKeys extends string>(props: Record<KPropKeys, string | number>) =>
    makeCustomPropertiesInternal({ default: props }, cache);
