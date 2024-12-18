import { isObject } from './typePredicates.js';
import type { AnimatableCSSProperties as CSSProps } from './types.js';

// global flag makes subsequent calls of capRegex.test advance to the next match
const capRegex = /[A-Z]/g;

export const commonComponentProps = {
  checked: true,
  children: true,
  class: true,
  className: true,
  disabled: true,
  href: true,
  id: true,
  name: true,
  placeholder: true,
  src: true,
  style: true,
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

/** Props that are used internally and not passed on to the underlying component */
const skippedProps = new Set(['component', 'mediaQueries', 'props']);

const doubleSpecificityPrefixes: Record<string, true> = {
  animation: true,
  background: true,
  flex: true,
  font: true,
  margin: true,
  padding: true,
};

const shorthandProps = {
  marginH: (margin: CSSProps['marginLeft']): CSSProps => ({
    marginLeft: margin,
    marginRight: margin,
  }),

  marginV: (margin: CSSProps['marginTop']): CSSProps => ({
    marginTop: margin,
    marginBottom: margin,
  }),

  paddingH: (padding: CSSProps['paddingLeft']): CSSProps => ({
    paddingLeft: padding,
    paddingRight: padding,
  }),

  paddingV: (padding: CSSProps['paddingTop']): CSSProps => ({
    paddingTop: padding,
    paddingBottom: padding,
  }),
};

export type ShorthandProps = {
  [K in keyof typeof shorthandProps]?: Parameters<
    (typeof shorthandProps)[K]
  >[0];
};

export interface ParsedStyleProp {
  pseudoelement?: string;
  pseudoclass?: string;
  specificity: number;
  propName: string;
  propValue: any;
  queryString?: string;
  ampersandString?: string;
}

export type CommonComponentProp = keyof typeof commonComponentProps;

export const parseStyleProps = (
  props: Record<string, unknown>,
  ampersandString?: string,
  queryString?: string
): {
  parsedStyleProps: Record<string, ParsedStyleProp>;
  componentProps: Record<string, any>;
} => {
  const componentProps: Record<string, any> =
    typeof props.props === 'object' ? { ...props.props } : {};

  const parsedStyleProps: Record<string, ParsedStyleProp> = {};
  for (const originalPropName in props) {
    const propValue = props[originalPropName];

    const isMq = originalPropName.startsWith('@media ');
    const isContainer = originalPropName.startsWith('@container ');
    if (
      (isMq || isContainer) &&
      // infinite nesting isn't supported
      !ampersandString &&
      !queryString &&
      isObject(propValue)
    ) {
      const result = parseStyleProps(propValue, undefined, originalPropName);
      Object.assign(parsedStyleProps, result.parsedStyleProps);
      continue;
    }

    if (originalPropName.includes('&') && isObject(propValue)) {
      const result = parseStyleProps(
        propValue,
        ampersandString
          ? originalPropName.replace(/&/g, ampersandString)
          : originalPropName,
        queryString
      );
      Object.assign(parsedStyleProps, result.parsedStyleProps);
      continue;
    }

    // separate known component props from style props
    if (commonComponentProps.hasOwnProperty(originalPropName)) {
      componentProps[originalPropName] = props[originalPropName];
      continue;
    }

    if (
      skippedProps.has(originalPropName) ||
      !props.hasOwnProperty(originalPropName)
    ) {
      continue;
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
      componentProps[originalPropName] = props[originalPropName];
      continue;
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

    // check if we need to bump specificity
    if (propNamePrefix && doubleSpecificityPrefixes[propNamePrefix]) {
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
    if (typeof propFn === 'function') {
      const expandedProps = propFn(propValue as any);
      if (!isObject(expandedProps)) {
        continue;
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
        continue;
      }

      // biome-ignore lint/suspicious/noAssignInExpressions: chill
      const obj: ParsedStyleProp = (parsedStyleProps[propName + keySuffix] = {
        pseudoelement,
        pseudoclass,
        specificity,
        propName,
        propValue,
      });
      if (ampersandString) obj.ampersandString = ampersandString;
      if (queryString) obj.queryString = queryString;
    }
  }

  return {
    parsedStyleProps,
    componentProps,
  };
};
