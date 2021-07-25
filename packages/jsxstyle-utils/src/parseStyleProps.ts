import type { CSSProperties } from './types';

// global flag makes subsequent calls of capRegex.test advance to the next match
const capRegex = /[A-Z]/g;

const commonComponentProps = {
  // class (preact) and className (React) are handled separately
  checked: true,
  children: true,
  href: true,
  id: true,
  name: true,
  placeholder: true,
  style: true,
  type: true,
  value: true,
};

const pseudoelements = {
  after: true,
  before: true,
  placeholder: true,
  selection: true,
};

const pseudoclasses = {
  active: true,
  checked: true,
  disabled: true,
  empty: true,
  enabled: true,
  focus: true,
  hover: true,
  invalid: true,
  link: true,
  required: true,
  target: true,
  valid: true,
};

/** Props that are used internally and not passed on to the underlying component */
const skippedProps = {
  component: true,
  mediaQueries: true,
  props: true,
};

const doubleSpecificityPrefixes = {
  animation: true,
  background: true,
  flex: true,
  font: true,
  margin: true,
  padding: true,
};

const shorthandProps = {
  marginH: (margin: CSSProperties['marginLeft']): CSSProperties => ({
    marginLeft: margin,
    marginRight: margin,
  }),
  marginV: (margin: CSSProperties['marginTop']): CSSProperties => ({
    marginTop: margin,
    marginBottom: margin,
  }),
  paddingH: (padding: CSSProperties['paddingLeft']): CSSProperties => ({
    paddingLeft: padding,
    paddingRight: padding,
  }),
  paddingV: (padding: CSSProperties['paddingTop']): CSSProperties => ({
    paddingTop: padding,
    paddingBottom: padding,
  }),
};

export type ShorthandProp = typeof shorthandProps;

export interface ParsedStyleProp {
  pseudoelement?: string;
  pseudoclass?: string;
  specificity: number;
  propName: string;
  propValue: any;
}

export type ComponentProp = keyof typeof commonComponentProps;

export const parseStyleProps = (
  props: Record<string, any>,
  classNamePropKey: string
): {
  parsedStyleProps: Record<string, ParsedStyleProp>;
  componentProps: Record<string, any>;
} => {
  const componentProps: Record<string, any> =
    typeof props.props === 'object' ? { ...props.props } : {};

  const parsedStyleProps: Record<string, ParsedStyleProp> = {};
  for (const originalPropName in props) {
    const propValue = props[originalPropName];

    // separate known component props from style props
    if (commonComponentProps.hasOwnProperty(originalPropName)) {
      componentProps[originalPropName] = props[originalPropName];
      continue;
    }

    if (
      skippedProps.hasOwnProperty(originalPropName) ||
      originalPropName === classNamePropKey ||
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

    // check for pseudoelement prefix
    if (propNamePrefix && pseudoelements[propNamePrefix]) {
      pseudoelement = propNamePrefix;
      splitIndex = capRegex.lastIndex - 1;
      propNamePrefix =
        capRegex.test(originalPropName) &&
        originalPropName[splitIndex].toLowerCase() +
          originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
    }

    // check for pseudoclass prefix
    if (propNamePrefix && pseudoclasses[propNamePrefix]) {
      pseudoclass = propNamePrefix;
      splitIndex = capRegex.lastIndex - 1;
      propNamePrefix =
        capRegex.test(originalPropName) &&
        originalPropName[splitIndex].toLowerCase() +
          originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
    }

    // check if we need to bump specificity
    if (propNamePrefix && doubleSpecificityPrefixes[propNamePrefix]) {
      specificity++;
    }

    // trim prefixes off propName
    if (splitIndex > 0) {
      propName =
        originalPropName[splitIndex].toLowerCase() +
        originalPropName.slice(splitIndex + 1);
    }

    const keySuffix =
      (pseudoelement ? '::' + pseudoelement : '') +
      (pseudoclass ? ':' + pseudoclass : '');

    const propFn = shorthandProps[propName];
    if (typeof propFn === 'function') {
      const expandedProps = propFn(propValue);
      if (expandedProps == null || typeof expandedProps !== 'object') {
        continue;
      }
      for (const expandedPropName in expandedProps) {
        const expandedPropValue = expandedProps[expandedPropName];
        if (expandedPropValue == null || expandedPropValue === false) {
          continue;
        }

        parsedStyleProps[expandedPropName + keySuffix] = {
          pseudoelement,
          pseudoclass,
          specificity,
          propName: expandedPropName,
          propValue: expandedPropValue,
        };
      }
    } else {
      if (propValue == null || propValue === false) {
        continue;
      }

      parsedStyleProps[propName + keySuffix] = {
        pseudoelement,
        pseudoclass,
        specificity,
        propName,
        propValue,
      };
    }
  }

  return {
    parsedStyleProps,
    componentProps,
  };
};
