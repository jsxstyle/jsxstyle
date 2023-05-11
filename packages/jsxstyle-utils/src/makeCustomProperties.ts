import { canUseDOM } from './addStyleToHead';
import {
  type BuildOptions,
  type VariantMap,
  generateCustomPropertiesFromVariants,
} from './generateCustomPropertiesFromVariants';

declare const __webpack_nonce__: string | undefined;

const makeCustomPropertiesInternal = <
  KPropKey extends string,
  TVariantName extends string
>(
  variantMap: VariantMap<TVariantName, KPropKey>
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
      variantMap as any
    );
  },

  build: (
    buildOptions: BuildOptions = {}
  ): {
    /** Only available when NODE_ENV is not "production" */
    reset: () => void;
    setVariant: (variantName: TVariantName | null) => void;
    variants: readonly TVariantName[];
  } & {
    [K in KPropKey]: string;
  } & {
    [K in TVariantName as `activate${Capitalize<K>}`]: () => void;
  } => {
    let overrideElement: Element | null = null;
    let reset: (() => void) | undefined;

    const { customProperties, overrideClasses, styles, variantNames } =
      generateCustomPropertiesFromVariants(variantMap, buildOptions);

    if (canUseDOM) {
      const styleElement = document.createElement('style');
      if (typeof __webpack_nonce__ !== 'undefined') {
        styleElement.nonce = __webpack_nonce__;
      }
      styleElement.appendChild(
        document.createTextNode('/* jsxstyle custom properties */')
      );
      document.head.appendChild(styleElement);

      const sheet = styleElement.sheet;
      if (sheet) {
        styles.forEach((cssRule) =>
          sheet.insertRule(cssRule, sheet.cssRules.length)
        );
      }

      // don't want folks resetting this in prod
      if (process.env.NODE_ENV !== 'production') {
        reset = () => void document.head.removeChild(styleElement);
      }

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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    returnValue.reset = reset || (() => {});
    returnValue.setVariant = setVariant;
    returnValue.variants = variantNames;

    return returnValue as any;
  },
});

export const makeCustomProperties = <KPropKeys extends string>(
  props: Record<KPropKeys, string | number>
) => makeCustomPropertiesInternal({ default: props });
