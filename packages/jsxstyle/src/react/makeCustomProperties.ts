import { canUseDOM } from '../utils/addStyleToHead';
import {
  generateCustomPropertiesFromVariants,
  type VariantMap,
} from '../utils/generateCustomPropertiesFromVariants';

declare const __webpack_nonce__: string | undefined;

interface BuildOptions {
  /**
   * The selector of the DOM node that will receive variant override CSS classes.
   *
   * If this value is not set, variant override CSS classes will be added to `<html>` element.
   */
  selector?: string;
  /**
   * The prefix that will be added to custom property names and the override CSS classes.
   *
   * Defaults to `jsxstyle`.
   */
  namespace?: string;
  /**
   * Identifier that will be used in jsxstyle dev tools to expose.
   */
  name?: string;
}

const updateStylesForVariantMap = (variantMap: VariantMap<string, string>) => {
  const { styles } = generateCustomPropertiesFromVariants(
    variantMap,
    namespace
  );

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
  }
};

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
    variantMap[variantName as any] = props;
    return makeCustomPropertiesInternal<KPropKey, TVariantName | TName>(
      variantMap as any
    );
  },

  build: ({ selector, namespace = 'jsxstyle', name }: BuildOptions = {}): {
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
      generateCustomPropertiesFromVariants(variantMap, namespace);

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
    }

    if (canUseDOM) {
      if (selector) {
        overrideElement = document.querySelector(selector);
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

    returnValue.reset = reset || (() => {});
    returnValue.setVariant = setVariant;
    returnValue.variants = variantNames;

    return returnValue as any;
  },
});

export const makeCustomProperties = <KPropKeys extends string>(
  props: Record<KPropKeys, string | number>
) => makeCustomPropertiesInternal({ default: props });
