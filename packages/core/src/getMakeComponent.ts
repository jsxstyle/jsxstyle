import type { StyleCache } from './getStyleCache.js';
import { processMakeComponentStyleProps } from './processMakeComponentStyleProp.js';
import type {
  JsxstyleComponentStyleProps,
  MakeComponentCustomPropCSSProperties,
} from './types.js';

const knownPropsSymbol = Symbol('knownPropValues');
const propValuesToCSSMapSymbol = Symbol('valuesToCSSProps');

export class CustomProp<T extends string | number> {
  constructor(
    /** All possible values that could be passed to this custom prop */
    knownValues: T[],
    /** Function that returns the style object for a given value */
    getCSSPropsForCustomPropValue: (
      value: T
    ) => MakeComponentCustomPropCSSProperties
  ) {
    this[knownPropsSymbol] = knownValues;
    for (const value of knownValues) {
      this[propValuesToCSSMapSymbol][value] =
        getCSSPropsForCustomPropValue(value);
    }
  }
  public readonly [knownPropsSymbol]: T[];
  public readonly [propValuesToCSSMapSymbol] = {} as Record<
    T,
    MakeComponentCustomPropCSSProperties
  >;
}

export interface CustomPropMap {
  [key: string]:
    | CustomProp<string | number>
    | MakeComponentCustomPropCSSProperties;
}

/** Toggles a class name on or off */
interface BooleanCustomProp {
  type: 'boolean';
  classNames: Record<string, string>;
}

/** Value can be one of many values. Each potential value maps to a class name. */
interface UnionCustomProp<TValue extends string | number> {
  type: 'union';
  classNames: {
    [propValue in TValue]: Record<string, string>;
  };
}

type ProcessedCustomPropMap<
  TCustomPropMap extends CustomPropMap = CustomPropMap,
> = {
  [key in keyof TCustomPropMap]?:
    | BooleanCustomProp
    | UnionCustomProp<string | number>;
};

type GetProcessedCustomPropMap<TCustomPropMap extends CustomPropMap> = {
  [key in keyof TCustomPropMap]?: TCustomPropMap[key] extends CustomProp<
    infer T
  >
    ? UnionCustomProp<T>
    : BooleanCustomProp;
};

const processCustomPropMap = <TCustomPropMap extends CustomPropMap>(
  customPropMap: TCustomPropMap,
  cache: StyleCache
): GetProcessedCustomPropMap<TCustomPropMap> => {
  const processedPropMap: ProcessedCustomPropMap<TCustomPropMap> = {};
  for (const customPropName in customPropMap) {
    // biome-ignore lint/style/noNonNullAssertion: for loop typing sux
    const customPropItem = customPropMap[customPropName]!;
    if (customPropItem instanceof CustomProp) {
      const processedProp: UnionCustomProp<string | number> = {
        type: 'union',
        classNames: {},
      };

      processedPropMap[customPropName] = processedProp;

      for (const variantValue of customPropItem[knownPropsSymbol]) {
        const styleRule =
          // biome-ignore lint/style/noNonNullAssertion: for loop typing sux
          customPropItem[propValuesToCSSMapSymbol][variantValue]!;
        const result = processMakeComponentStyleProps(
          styleRule,
          cache.getClassNameForKey,
          cache.insertRule
        );
        processedProp.classNames[variantValue] = result;
      }
    } else {
      const result = processMakeComponentStyleProps(
        customPropItem,
        cache.getClassNameForKey,
        cache.insertRule
      );
      const processedProp: BooleanCustomProp = {
        type: 'boolean',
        classNames: result,
      };
      processedPropMap[customPropName] = processedProp;
    }
  }
  return processedPropMap as GetProcessedCustomPropMap<TCustomPropMap>;
};

const getMakeComponentProps = <
  TCustomPropMap extends CustomPropMap,
  TComponentProps extends Record<string, unknown>,
>(
  /**
   * The name of the prop that is used to set a CSS class name on an element.
   * In React, classes are assigned to elements using the "className" prop.
   * Preact, Solid, and Astro use "class".
   */
  classNamePropName: string,
  /**
   * Props passed to the `MakeComponent` component. This object can contain a
   * mix of custom props and DOM props. Custom props are extracted;
   * everything else is passed through unmodified.
   */
  componentProps: TComponentProps,
  /**
   * Default style object that has been processed and turned into a mapping of
   * prop names to class names.
   */
  defaultClassNames: Record<string, string> | null,
  /**
   * A mapping of custom prop name to custom prop value. Value is either a
   * `BooleanCustomProp` or a `UnionCustomProp`.
   */
  classNamesForCustomProp: GetProcessedCustomPropMap<TCustomPropMap> | null
) => {
  // we start with the defaults. they may get overridden by custom props below.
  const classNameObject: Record<string, string> = { ...defaultClassNames };
  const processedProps: Record<string, any> = {};
  for (const propName in componentProps) {
    const propValue = componentProps[propName];
    const customPropClassNamesByValue = classNamesForCustomProp?.[propName];

    if (customPropClassNamesByValue) {
      if (customPropClassNamesByValue.type === 'boolean') {
        if (propValue === true) {
          Object.assign(
            classNameObject,
            customPropClassNamesByValue.classNames
          );
        }
      } else if (customPropClassNamesByValue.type === 'union') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          const classNamesForValue =
            customPropClassNamesByValue.classNames[propValue];
          if (classNamesForValue) {
            Object.assign(classNameObject, classNamesForValue);
          }
        }
      }
    } else {
      // pass it through unmodified
      processedProps[propName] = componentProps[propName];
    }
  }

  let className = componentProps[classNamePropName] || '';
  for (const key in classNameObject) {
    const value = classNameObject[key];
    if (value) {
      className += (className === '' ? '' : ' ') + value;
    }
  }

  if (className) {
    processedProps[classNamePropName] = className;
  }

  return processedProps as TComponentProps;
};

export type GetPropsForVariantMap<TCustomPropMap extends CustomPropMap> = {
  [K in keyof TCustomPropMap]?: TCustomPropMap[K] extends CustomProp<infer T>
    ? T
    : TCustomPropMap[K] extends MakeComponentCustomPropCSSProperties
      ? boolean
      : never;
};

export const makeGetPropsFunction = <TCustomPropMap extends CustomPropMap>(
  cache: StyleCache,
  defaultStyles: MakeComponentCustomPropCSSProperties | null = null,
  variants: TCustomPropMap | null = null
) => {
  const defaultClassNames =
    defaultStyles &&
    processMakeComponentStyleProps(
      defaultStyles,
      cache.getClassNameForKey,
      cache.insertRule
    );
  const customPropClassNames =
    variants && processCustomPropMap(variants, cache);

  const getProps = <TComponentProps extends Record<string, any>>(
    props: TComponentProps
  ): TComponentProps => {
    return getMakeComponentProps<TCustomPropMap, TComponentProps>(
      'className',
      props,
      defaultClassNames,
      customPropClassNames
    );
  };

  return getProps;
};

export const makeVariant = <const T extends string | number>(
  variants: T[],
  handleVariant: (variant: T) => JsxstyleComponentStyleProps
) => new CustomProp(variants, handleVariant);
