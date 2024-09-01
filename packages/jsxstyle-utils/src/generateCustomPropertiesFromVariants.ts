import { dangerousStyleValue } from './dangerousStyleValue';

type PropMap<KPropKeys extends string> = {
  [K in KPropKeys]?: string | number;
} & {
  mediaQuery?: string;
};

export type VariantMap<K extends string, KPropKeys extends string> = Record<
  K,
  PropMap<Exclude<KPropKeys, 'mediaQuery'>>
> & { default: { [PK in KPropKeys]: string | number } };

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

export const generateCustomPropertiesFromVariants = <
  KPropKey extends string,
  TVariantName extends string,
>(
  variantMap: VariantMap<TVariantName, KPropKey>,
  buildOptions: BuildOptions = {}
) => {
  const {
    namespace = 'jsxstyle',
    selector = ':root',
    mangle = false,
  } = buildOptions;
  /** Prefix for the override class name */
  const overrideClassNamePrefix = namespace + '_';

  const propKeys: KPropKey[] = Object.keys(variantMap.default) as any;
  const variantNames: TVariantName[] = Object.keys(variantMap) as any;

  const styles: string[] = [];

  const customProperties: Record<KPropKey, string> = {} as any;
  const mangleMap: Partial<Record<KPropKey, number>> = {};
  let mangleIndex = 0;

  const variants: Record<TVariantName, CustomPropertyVariant> = {} as any;

  for (const variantName of variantNames) {
    const variant: PropMap<KPropKey> =
      variantMap[variantName as keyof typeof variantMap];
    let cssBody = '';
    for (const propKey of propKeys) {
      if (propKey === 'mediaQuery') break;
      const customPropName =
        `--${namespace}` +
        (mangle
          ? // biome-ignore lint/suspicious/noAssignInExpressions: chill
            (mangleMap[propKey] ??= mangleIndex++).toString(36)
          : `-${propKey}`);
      customProperties[propKey] = `var(${customPropName})`;
      const propValue = dangerousStyleValue('', variant[propKey]);
      if (propValue) {
        cssBody += `${customPropName}: ${propValue};`;
      }
    }

    const overrideClassName = overrideClassNamePrefix + variantName;

    const variantObj: CustomPropertyVariant = {
      className: overrideClassName,
    };
    variants[variantName] = variantObj;

    if (variantName === 'default') {
      styles.unshift(`${selector} { ${cssBody} }`);
    }
    // `:not(.\\9)` bumps specificity, +1 class for each `.\\9`
    styles.push(`${selector}:not(.\\9).${overrideClassName} { ${cssBody} }`);
    if (variant.mediaQuery) {
      variantObj.mediaQuery = `@media ${variant.mediaQuery}`;
      styles.push(
        `@media ${variant.mediaQuery} { ${selector}:not(.\\9) { ${cssBody} } }`
      );
    }
  }

  return {
    customProperties,
    variantNames,
    variants,
    styles,
  };
};
