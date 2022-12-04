import { canUseDOM } from '../utils/addStyleToHead';

declare const __webpack_nonce__: string | undefined;

type PropMap<KPropKeys extends string> = {
  [K in KPropKeys]?: string | number;
} & {
  mediaQuery?: string;
};

type VariantMap<K extends string, KPropKeys extends string> = Record<
  K,
  PropMap<KPropKeys>
> & { default: { [PK in KPropKeys]: string | number } };

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
}

const makeCustomPropertiesInternal = <
  KPropKeys extends string,
  TVariantNames extends string
>(
  variantMap: VariantMap<TVariantNames, KPropKeys>
) => ({
  addVariant: <TName extends string>(
    variantName: TName,
    props: {
      [Key in KPropKeys]?: string | number;
    } & {
      /** An optional media query that will activate this variant */
      mediaQuery?: string;
    }
  ) => {
    variantMap[variantName as any] = props;
    return makeCustomPropertiesInternal<KPropKeys, TVariantNames | TName>(
      variantMap as any
    );
  },

  build: ({ selector, namespace = 'jsxstyle' }: BuildOptions = {}): {
    /** Only available when NODE_ENV is not "production" */
    reset: () => void;
    setVariant: (variantName: TVariantNames) => void;
    variants: readonly TVariantNames[];
  } & {
    [K in KPropKeys]: string;
  } & {
    [K in TVariantNames as `activate${Capitalize<K>}`]: () => void;
  } => {
    let overrideElement: Element | null = null;
    let insertRule: ((rule: string) => void) | null = null;
    let reset: (() => void) | undefined;

    /** Prefix for the override class name */
    const overrideClassNamePrefix = namespace + '-override__';

    /** Prefix for the CSS custom property names */
    const customPropPrefix = `--${namespace}-`;

    if (canUseDOM) {
      const styleElement = document.createElement('style');
      if (typeof __webpack_nonce__ !== 'undefined') {
        styleElement.nonce = __webpack_nonce__;
      }
      styleElement.appendChild(
        document.createTextNode('/* jsxstyle custom properties */')
      );
      document.head.appendChild(styleElement);
      insertRule = (rule: string) => {
        const sheet = styleElement.sheet;
        if (sheet) {
          sheet.insertRule(rule, sheet.cssRules.length);
        }
      };

      // don't want folks resetting this in prod
      if (process.env.NODE_ENV !== 'production') {
        reset = () => void document.head.removeChild(styleElement);
      }

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

    const propNames: KPropKeys[] = Object.keys(variantMap.default) as any;
    const variantNames: TVariantNames[] = Object.keys(variantMap) as any;

    let defaultCss = '';
    for (const propName of propNames) {
      const propValue = variantMap.default[propName];
      defaultCss += `${customPropPrefix}${propName}: ${propValue};`;
    }

    const setVariant = (variantName: TVariantNames): void => {
      if (!overrideElement) return;
      overrideElement.classList.remove(
        ...variantNames.map((key) => `${overrideClassNamePrefix}${key}`)
      );
      overrideElement.classList.add(`${overrideClassNamePrefix}${variantName}`);
    };

    const returnValue: Record<string, any> = {};

    insertRule?.(`:root { ${defaultCss} }`);

    for (const variantName of variantNames) {
      returnValue[
        `activate${variantName[0].toUpperCase()}${variantName.slice(1)}`
      ] = () => void setVariant(variantName);

      const variant = variantMap[variantName as keyof typeof variantMap];
      let cssBody = '';
      for (const propName of propNames) {
        if (propName === 'mediaQuery') break;
        const propValue = variant[propName];
        if (propValue != null) {
          cssBody += `${customPropPrefix}${propName}: ${propValue};`;
        }
      }

      const fullClassName = `.${overrideClassNamePrefix}${variantName}`;

      insertRule?.(
        `:root${fullClassName}, :root ${fullClassName} { ${cssBody} }`
      );
      if (variant.mediaQuery) {
        insertRule?.(`@media ${variant.mediaQuery} { :root { ${cssBody} } }`);
      }
    }

    for (const key of propNames) {
      returnValue[key] = `var(--jsxstyle-${key})`;
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
