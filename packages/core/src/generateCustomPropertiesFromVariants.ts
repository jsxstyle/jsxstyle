import { dangerousStyleValue } from './dangerousStyleValue.js';
import type {
  GetOptionalCustomProperties,
  VariantOptions,
} from './makeCustomProperties.js';

export type CustomPropsObject = {
  [key: string | number]: string | number | CustomPropsObject;
};

export type GetCustomProperties<TCustomProps extends CustomPropsObject> = {
  [K in keyof TCustomProps]: TCustomProps[K] extends string | number
    ? `var(--${string})`
    : TCustomProps[K] extends CustomPropsObject
      ? GetCustomProperties<TCustomProps[K]>
      : never;
};

type Variant<T> = {
  props: T;
  options?: VariantOptions;
};

export type VariantMap<
  TVariantName extends string,
  TCustomProps extends CustomPropsObject,
> = {
  default: Variant<TCustomProps>;
} & {
  [K in TVariantName]: Variant<GetOptionalCustomProperties<TCustomProps>>;
};

export interface BuildOptions {
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
   * Whether or not to crunch custom property names down to something compact.
   * If you’re referencing these custom properties outside of the official API (i.e. in plain CSS), you should not enable this option.
   *
   * Defaults to `false`.
   */
  mangle?: boolean;
}

export interface CustomPropertyVariant {
  className: string;
  mediaQuery?: `@media ${string}`;
}

const getCustomPropsFromDefaultVariant = <
  TCustomProps extends CustomPropsObject,
>(
  obj: TCustomProps,
  namespace: string,
  shouldMangle = false,
  index = 0,
  propMap: Record<string, string> = {},
  customProps: CustomPropsObject = {},
  keyPrefix = ''
) => {
  let mangleIndex = index;
  let cssBody = '';
  for (const key in obj) {
    const value = obj[key];
    if (keyPrefix === '' && (key === 'mediaQuery' || key === 'colorScheme')) {
      continue;
    }
    const keyPlusPrefix = (keyPrefix ? keyPrefix + '-' : '') + key;
    if (typeof value === 'string' || typeof value === 'number') {
      const prop = shouldMangle
        ? (mangleIndex++).toString(36)
        : '-' + keyPlusPrefix;
      propMap[keyPlusPrefix] = `--${namespace || 'jsxstyle'}${prop}`;
      customProps[key] = `var(${propMap[keyPlusPrefix]})`;
      cssBody += `${propMap[keyPlusPrefix]}:${dangerousStyleValue('', value)};`;
    } else if (typeof value === 'object') {
      customProps[key] = {};
      const result = getCustomPropsFromDefaultVariant(
        value,
        namespace,
        shouldMangle,
        mangleIndex,
        propMap,
        customProps[key],
        keyPlusPrefix
      );
      mangleIndex = result.mangleIndex;
      cssBody += result.css;
    }
  }
  return { mangleIndex, propMap, customProps, css: cssBody };
};

const getCustomPropsFromVariant = <
  T extends GetOptionalCustomProperties<CustomPropsObject>,
>(
  obj: T,
  shouldMangle = false,
  propMap: Record<string, string> = {},
  keyPrefix = ''
) => {
  let css = '';
  for (const key in obj) {
    if (keyPrefix === '' && (key === 'mediaQuery' || key === 'colorScheme'))
      continue;
    const keyPlusPrefix = (keyPrefix ? keyPrefix + '-' : '') + key;
    if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
      const propName = propMap[keyPlusPrefix];
      const propValue = dangerousStyleValue('', obj[key]);
      if (!propName || !propValue) continue;
      css += `${propName}:${dangerousStyleValue('', obj[key])};`;
    } else if (typeof obj[key] === 'object') {
      css += getCustomPropsFromVariant(
        obj[key],
        shouldMangle,
        propMap,
        keyPlusPrefix
      );
    }
  }
  return css;
};

export const generateCustomPropertiesFromVariants = <
  TVariantName extends string,
  TCustomProps extends CustomPropsObject,
>(
  variantMap: VariantMap<TVariantName, TCustomProps>,
  buildOptions: BuildOptions = {}
) => {
  const {
    namespace = 'jsxstyle',
    selector = ':root',
    mangle = false,
  } = buildOptions;
  /** Prefix for the override class name */
  const overrideClassNamePrefix = namespace + '_';

  const variantNames: TVariantName[] = Object.keys(variantMap) as any;

  const styles: string[] = [];

  const defaultVariant = variantMap.default;

  const { propMap, css, customProps } = getCustomPropsFromDefaultVariant(
    defaultVariant.props,
    namespace,
    mangle
  );

  const defaultCss = (
    (defaultVariant.options?.colorScheme
      ? `color-scheme:${defaultVariant.options.colorScheme};`
      : '') + css
  ).slice(0, -1);

  const defaultMediaQuery = variantMap.default.options?.mediaQuery
    ? `@media ${variantMap.default.options.mediaQuery}`
    : undefined;

  styles.push(`${selector}{${defaultCss}}`);
  styles.push(
    `${selector}:not(.\\9).${overrideClassNamePrefix}default{${defaultCss}}`
  );
  if (defaultMediaQuery) {
    styles.push(`${defaultMediaQuery}{${selector}:not(.\\9){${defaultCss}}}`);
  }

  const variants: Record<TVariantName, CustomPropertyVariant> = {
    default: {
      className: overrideClassNamePrefix + 'default',
      mediaQuery: defaultMediaQuery,
    },
  } as any;

  for (const variantName of variantNames) {
    if (variantName === 'default') continue;
    const variant = variantMap[variantName];

    let cssBody = getCustomPropsFromVariant(variant.props, mangle, propMap);

    const colorScheme =
      variant.options?.colorScheme &&
      dangerousStyleValue('colorScheme', variant.options.colorScheme);
    if (colorScheme) {
      cssBody = `color-scheme:${colorScheme};${cssBody}`;
    }
    cssBody = cssBody.slice(0, -1);

    const overrideClassName = overrideClassNamePrefix + variantName;

    const variantObj: CustomPropertyVariant = {
      className: overrideClassName,
      mediaQuery: variant.options?.mediaQuery
        ? `@media ${variant.options.mediaQuery}`
        : undefined,
    };
    variants[variantName] = variantObj;

    if (variantName === 'default') {
      styles.unshift(`${selector}{${cssBody}}`);
    }
    // `:not(.\\9)` bumps specificity, +1 class for each `.\\9`
    styles.push(`${selector}:not(.\\9).${overrideClassName}{${cssBody}}`);
    if (variant.options?.mediaQuery) {
      // variantObj.mediaQuery = `@media ${variant.mediaQuery}`;
      styles.push(
        `@media ${variant.options.mediaQuery}{${selector}:not(.\\9){${cssBody}}}`
      );
    }
  }

  return {
    customProperties: customProps as GetCustomProperties<TCustomProps>,
    variantNames,
    variants,
    styles,
  };
};
