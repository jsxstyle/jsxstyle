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

export const generateCustomPropertiesFromVariants = <
  KPropKey extends string,
  TVariantName extends string
>(
  variantMap: VariantMap<TVariantName, KPropKey>,
  namespace: string
) => {
  /** Prefix for the override class name */
  const overrideClassNamePrefix = namespace + '-override__';

  /** Prefix for the CSS custom property names */
  const customPropPrefix = `--${namespace}-`;

  const propNames: KPropKey[] = Object.keys(variantMap.default) as any;
  const variantNames: TVariantName[] = Object.keys(variantMap) as any;

  const initialStyles: string[] = [];
  const overrideStyles: string[] = [];

  const customProperties: Record<KPropKey, string> = {} as any;
  const overrideClasses: Record<TVariantName, string> = {} as any;

  for (const variantName of variantNames) {
    const variant: PropMap<KPropKey> =
      variantMap[variantName as keyof typeof variantMap];
    let cssBody = '';
    for (const propName of propNames) {
      if (propName === 'mediaQuery') break;
      customProperties[propName] = `var(${customPropPrefix}${propName})`;
      const propValue = dangerousStyleValue('', variant[propName]);
      if (propValue) {
        cssBody += `${customPropPrefix}${propName}: ${propValue};`;
      }
    }

    const overrideClassName = `${overrideClassNamePrefix}${variantName}`;
    overrideClasses[variantName] = overrideClassName;
    if (variantName === 'default') {
      initialStyles.unshift(`:root { ${cssBody} }`);
    }
    overrideStyles.push(
      `:root.${overrideClassName}, :root .${overrideClassName} { ${cssBody} }`
    );
    if (variant.mediaQuery) {
      initialStyles.push(
        `@media ${variant.mediaQuery} { :root { ${cssBody} } }`
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
