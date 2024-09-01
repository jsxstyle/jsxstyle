import { canUseDOM } from './addStyleToHead';
import { generateCustomPropertiesFromVariants } from './generateCustomPropertiesFromVariants';
import type {
  BuildOptions,
  CustomPropertyVariant,
  VariantMap,
} from './generateCustomPropertiesFromVariants';
import type { StyleCache } from './getStyleCache';

interface CustomPropertyVariantWithSetMethod extends CustomPropertyVariant {
  activate: () => void;
}

const makeCustomPropertiesInternal = <
  KPropKey extends string,
  TVariantName extends string,
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
          typeof process !== 'undefined' &&
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
    };
  },
});

export const getCustomPropertiesFunction =
  (cache: StyleCache) =>
  <KPropKeys extends string>(props: Record<KPropKeys, string | number>) =>
    makeCustomPropertiesInternal({ default: props }, cache);
