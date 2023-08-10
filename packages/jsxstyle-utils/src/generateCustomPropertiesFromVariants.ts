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

export const generateCustomPropertiesFromVariants = <
  KPropKey extends string,
  TVariantName extends string
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
  const overrideClassNamePrefix = namespace + '-override__';

  const propKeys: KPropKey[] = Object.keys(variantMap.default) as any;
  const variantNames: TVariantName[] = Object.keys(variantMap) as any;

  const initialStyles: string[] = [];
  const overrideStyles: string[] = [];

  const customProperties: Record<KPropKey, string> = {} as any;
  const overrideClasses: Record<TVariantName, string> = {} as any;
  const mangleMap: Partial<Record<KPropKey, number>> = {};
  let mangleIndex = 0;

  for (const variantName of variantNames) {
    const variant: PropMap<KPropKey> =
      variantMap[variantName as keyof typeof variantMap];
    let cssBody = '';
    for (const propKey of propKeys) {
      if (propKey === 'mediaQuery') break;
      const customPropName =
        `--${namespace}` +
        (mangle
          ? (mangleMap[propKey] ||= mangleIndex++).toString(36)
          : `-${propKey}`);
      customProperties[propKey] = `var(${customPropName})`;
      const propValue = dangerousStyleValue('', variant[propKey]);
      if (propValue) {
        cssBody += `${customPropName}: ${propValue};`;
      }
    }

    const overrideClassName = `${overrideClassNamePrefix}${variantName}`;
    overrideClasses[variantName] = overrideClassName;
    if (variantName === 'default') {
      initialStyles.unshift(`${selector} { ${cssBody} }`);
    }
    overrideStyles.push(
      `${selector}.${overrideClassName}, ${selector} .${overrideClassName} { ${cssBody} }`
    );
    if (variant.mediaQuery) {
      initialStyles.push(
        `@media ${variant.mediaQuery} { ${selector} { ${cssBody} } }`
      );
    }
  }

  return {
    customProperties,
    variantNames,
    overrideClasses,
    styles: [...initialStyles, ...overrideStyles],
  };
};
