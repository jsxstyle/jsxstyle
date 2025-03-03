import { parseStyleProps } from './parseStyleProps.js';
import { isObject } from './typePredicates.js';
import type { CSSProperties } from './types.js';

// global flag makes subsequent calls of capRegex.test advance to the next match
const capRegex = /[A-Z]/g;

export const commonComponentProps = {
  alt: true,
  checked: true,
  children: true,
  class: true,
  className: true,
  disabled: true,
  href: true,
  id: true,
  name: true,
  placeholder: true,
  slot: true,
  src: true,
  style: true,
  title: true,
  type: true,
  value: true,
};

const pseudoelements = new Set(['after', 'before', 'placeholder', 'selection']);

const pseudoclasses = new Set([
  'active',
  'checked',
  'disabled',
  'empty',
  'enabled',
  'focus',
  'hover',
  'invalid',
  'link',
  'required',
  'target',
  'valid',
]);

export const doubleSpecificityPrefixes = new Set<string>([
  'animation',
  'background',
  'flex',
  'font',
  'margin',
  'padding',
]);

export const shorthandProps = {
  marginH: (margin: CSSProperties['marginLeft']) => ({
    marginLeft: margin,
    marginRight: margin,
  }),

  marginV: (margin: CSSProperties['marginTop']) => ({
    marginTop: margin,
    marginBottom: margin,
  }),

  paddingH: (padding: CSSProperties['paddingLeft']) => ({
    paddingLeft: padding,
    paddingRight: padding,
  }),

  paddingV: (padding: CSSProperties['paddingTop']) => ({
    paddingTop: padding,
    paddingBottom: padding,
  }),
} satisfies Record<string, (value: any) => CSSProperties>;

export type ShorthandProps = {
  [K in keyof typeof shorthandProps]?: Parameters<
    (typeof shorthandProps)[K]
  >[0];
};

export interface ParsedStyleProp {
  /** The original camelcased prop name */
  key: string;
  pseudoelement?: string;
  pseudoclass?: string;
  specificity: number;
  propName: string;
  propValue: any;
  queryString?: string;
  ampersandString?: string;
}

export type CommonComponentProp = keyof typeof commonComponentProps;

interface ComponentProp {
  type: 'componentProp';
  key: string;
  value: any;
}

interface StyleProp {
  type: 'styleProp';
  parsedStyleProps: Record<string, ParsedStyleProp>;
}

export const parseStyleProp = (
  /** The original camelcased prop name */
  originalPropName: string,
  /** The value of the prop */
  propValue: any,
  /** String containing one or more `&` symbols */
  ampersandString?: string,
  /** String that starts with `"@media "` */
  queryString?: string
): ComponentProp | StyleProp | null => {
  const isMq = originalPropName.startsWith('@media ');
  const isContainer = originalPropName.startsWith('@container ');

  if (isMq && queryString) {
    console.error(
      '[jsxstyle] Nested media queries are not supported. Cannot nest `%s` inside `%s`.',
      originalPropName,
      queryString
    );
    return null;
  }

  if (isMq || isContainer) {
    if (
      ampersandString ||
      // infinite nesting isn't supported
      queryString ||
      // filter out invalid prop values
      !isObject(propValue)
    ) {
      return null;
    }
    const result = parseStyleProps(
      propValue,
      undefined,
      // prop name is a media or container query
      originalPropName
    );
    return {
      type: 'styleProp',
      parsedStyleProps: result.parsedStyleProps,
    };
  }

  if (originalPropName.includes('&')) {
    if (!isObject(propValue)) {
      return null;
    }
    const result = parseStyleProps(
      propValue,
      ampersandString
        ? originalPropName.replace(/&/g, ampersandString)
        : originalPropName,
      queryString
    );
    return {
      type: 'styleProp',
      parsedStyleProps: result.parsedStyleProps,
    };
  }

  // separate known component props from style props
  if (commonComponentProps.hasOwnProperty(originalPropName)) {
    return {
      type: 'componentProp',
      key: originalPropName,
      value: propValue,
    };
  }

  let propName: string = originalPropName;
  let pseudoelement: string | undefined;
  let pseudoclass: string | undefined;
  let specificity = 0;

  capRegex.lastIndex = 0;
  let splitIndex = 0;

  let propNamePrefix: string | false =
    capRegex.test(originalPropName) &&
    capRegex.lastIndex > 1 &&
    originalPropName.slice(0, capRegex.lastIndex - 1);

  // all /^on[A-Z]/ props get passed through to the underlying component
  if (propNamePrefix === 'on') {
    return {
      type: 'componentProp',
      key: originalPropName,
      value: propValue,
    };
  }

  if (!ampersandString) {
    // check for pseudoelement prefix
    if (propNamePrefix && pseudoelements.has(propNamePrefix)) {
      pseudoelement = propNamePrefix;
      splitIndex = capRegex.lastIndex - 1;
      propNamePrefix =
        capRegex.test(originalPropName) &&
        // biome-ignore lint/style/noNonNullAssertion: always valid
        originalPropName[splitIndex]!.toLowerCase() +
          originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
    }

    // check for pseudoclass prefix
    if (propNamePrefix && pseudoclasses.has(propNamePrefix)) {
      pseudoclass = propNamePrefix;
      splitIndex = capRegex.lastIndex - 1;
      propNamePrefix =
        capRegex.test(originalPropName) &&
        // biome-ignore lint/style/noNonNullAssertion: always valid
        originalPropName[splitIndex]!.toLowerCase() +
          originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
    }
  }

  if (propNamePrefix && doubleSpecificityPrefixes.has(propNamePrefix)) {
    specificity++;
  }

  // trim prefixes off propName
  if (splitIndex > 0) {
    propName =
      // biome-ignore lint/style/noNonNullAssertion: always valid
      originalPropName[splitIndex]!.toLowerCase() +
      originalPropName.slice(splitIndex + 1);
  }

  const keySuffix =
    (queryString || '') +
    (pseudoelement ? '::' + pseudoelement : '') +
    (pseudoclass ? ':' + pseudoclass : '') +
    (ampersandString || '');

  const propFn = shorthandProps[propName as keyof typeof shorthandProps];
  const parsedStyleProps: Record<string, ParsedStyleProp> = {};
  if (typeof propFn === 'function') {
    const expandedProps = propFn(propValue as any);
    if (!isObject(expandedProps)) {
      return null;
    }
    for (const expandedPropName in expandedProps) {
      const expandedPropValue =
        expandedProps[expandedPropName as keyof typeof expandedProps];
      if (expandedPropValue == null || expandedPropValue === false) {
        continue;
      }

      // biome-ignore lint/suspicious/noAssignInExpressions: chill
      const obj: ParsedStyleProp = (parsedStyleProps[
        expandedPropName + keySuffix
      ] = {
        key: originalPropName,
        pseudoelement,
        pseudoclass,
        specificity,
        propName: expandedPropName,
        propValue: expandedPropValue,
      });
      if (ampersandString) obj.ampersandString = ampersandString;
      if (queryString) obj.queryString = queryString;
    }
  } else {
    if (propValue == null || propValue === false) {
      return null;
    }

    // biome-ignore lint/suspicious/noAssignInExpressions: chill
    const obj: ParsedStyleProp = (parsedStyleProps[propName + keySuffix] = {
      key: propName + keySuffix,
      propName,
      propValue,
      specificity,
    });
    if (pseudoelement) obj.pseudoelement = pseudoelement;
    if (pseudoclass) obj.pseudoclass = pseudoclass;
    if (ampersandString) obj.ampersandString = ampersandString;
    if (queryString) obj.queryString = queryString;
  }

  return {
    type: 'styleProp',
    parsedStyleProps,
  };
};
