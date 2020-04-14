import { dangerousStyleValue } from './dangerousStyleValue';
import { hyphenateStyleName } from './hyphenateStyleName';
import { stringHash } from './stringHash';

// global flag makes subsequent calls of capRegex.test advance to the next match
const capRegex = /[A-Z]/g;

export const pseudoelements = {
  after: true,
  before: true,
  placeholder: true,
  selection: true,
};

export const pseudoclasses = {
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

const specialCaseProps = {
  children: true,
  class: true,
  className: true,
  component: true,
  mediaQueries: true,
  props: true,
  style: true,
};

const sameAxisPropNames: Record<string, [string, string]> = {
  paddingH: ['paddingLeft', 'paddingRight'],
  paddingV: ['paddingTop', 'paddingBottom'],
  marginH: ['marginLeft', 'marginRight'],
  marginV: ['marginTop', 'marginBottom'],
};

interface StyleObj {
  styles: string;
  mediaQuery?: string;
  pseudoclass?: string;
  pseudoelement?: string;
}

export interface StyleKeyObj {
  stylesByKey: Record<string, StyleObj>;
  classNameKey: string;
  /** An object of stringified keyframe styles keyed by animation name */
  animations?: Record<string, string>;
}

export function getStyleKeysForProps(
  props: Record<string, any> & { mediaQueries?: Record<string, string> },
  pretty = false
): StyleKeyObj | null {
  if (typeof props !== 'object' || props === null) {
    return null;
  }

  const propKeys = Object.keys(props).sort();
  const keyCount = propKeys.length;

  if (keyCount === 0) {
    return null;
  }

  const mediaQueries = props.mediaQueries;
  let usesMediaQueries = false;

  const stylesByKey: Record<string, StyleObj> = {};

  const styleKeyObj: StyleKeyObj = {
    classNameKey: '',
    stylesByKey,
  };

  let classNameKey = '';
  let animations: Record<string, string> | undefined;
  const seenMQs: Record<string, string> = {};

  const mqSortKeys: Record<string, string> = {};
  if (mediaQueries != null) {
    let idx = -1;
    for (const k in mediaQueries) {
      mqSortKeys[k] = `@${1000 + ++idx}`;
    }
  }

  for (let idx = -1; ++idx < keyCount; ) {
    const originalPropName = propKeys[idx];

    if (
      specialCaseProps.hasOwnProperty(originalPropName) ||
      !props.hasOwnProperty(originalPropName)
    ) {
      continue;
    }

    let propName: string = originalPropName;
    let propSansMQ: string | undefined;
    let pseudoelement: string | undefined;
    let pseudoclass: string | undefined;
    let mqKey: string | undefined;

    capRegex.lastIndex = 0;
    let splitIndex = 0;

    let prefix: string | false =
      capRegex.test(originalPropName) &&
      capRegex.lastIndex > 1 &&
      originalPropName.slice(0, capRegex.lastIndex - 1);

    // check for media query prefix
    if (prefix && mediaQueries != null && mediaQueries.hasOwnProperty(prefix)) {
      usesMediaQueries = true;
      mqKey = prefix;
      splitIndex = capRegex.lastIndex - 1;

      propSansMQ =
        originalPropName[splitIndex].toLowerCase() +
        originalPropName.slice(splitIndex + 1);

      prefix =
        capRegex.test(originalPropName) &&
        propSansMQ.slice(0, capRegex.lastIndex - splitIndex - 1);
    }

    // check for pseudoelement prefix
    if (prefix && pseudoelements.hasOwnProperty(prefix)) {
      pseudoelement = prefix;
      splitIndex = capRegex.lastIndex - 1;
      prefix =
        capRegex.test(originalPropName) &&
        originalPropName[splitIndex].toLowerCase() +
          originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
    }

    // check for pseudoclass prefix
    if (prefix && pseudoclasses.hasOwnProperty(prefix)) {
      pseudoclass = prefix;
      splitIndex = capRegex.lastIndex - 1;
    }

    // trim prefixes off propName
    if (splitIndex > 0) {
      propName =
        originalPropName[splitIndex].toLowerCase() +
        originalPropName.slice(splitIndex + 1);
    }

    let styleValue: any = props[originalPropName];
    const space = pretty ? ' ' : '';
    const colon = ':' + space;
    const newline = pretty ? '\n' : '';
    const semicolon = ';' + newline;
    const indent = pretty ? '  ' : '';
    if (
      propName === 'animation' &&
      styleValue &&
      typeof styleValue === 'object'
    ) {
      let animationValue = newline;
      for (const k in styleValue) {
        const obj = styleValue[k];
        animationValue += k + space + '{' + newline;
        for (const childPropName in obj) {
          const value = dangerousStyleValue(childPropName, obj[childPropName]);
          animationValue +=
            indent +
            hyphenateStyleName(childPropName) +
            colon +
            value +
            semicolon;
        }
        animationValue += '}' + newline;
      }
      const animationKey =
        'jsxstyle_' + stringHash(animationValue).toString(36);
      propName = 'animationName';
      styleValue = animationKey;
      animations = animations || {};
      animations[animationKey] = animationValue;
    } else {
      styleValue = dangerousStyleValue(propName, props[originalPropName]);
      if (styleValue === '') {
        continue;
      }
    }

    const mediaQuery = mqKey && mediaQueries![mqKey];
    const mqSortKey = mqKey && mqSortKeys[mqKey];

    const key =
      '.' +
      (mqSortKey || '') +
      (pseudoclass ? ':' + pseudoclass : '') +
      (pseudoelement ? '::' + pseudoelement : '');

    if (!stylesByKey.hasOwnProperty(key)) {
      stylesByKey[key] = { styles: newline };
      if (mediaQuery) {
        stylesByKey[key].mediaQuery = mediaQuery;
      }
      if (pseudoclass) {
        stylesByKey[key].pseudoclass = pseudoclass;
      }
      if (pseudoelement) {
        stylesByKey[key].pseudoelement = pseudoelement;
      }
    }

    if (mediaQuery) {
      seenMQs[mediaQuery] = seenMQs[mediaQuery] || '';
      seenMQs[mediaQuery] += propSansMQ + ':' + styleValue + ';';
    } else {
      classNameKey += originalPropName + ':' + styleValue + ';';
    }

    const value = colon + styleValue + semicolon;

    const propArray = sameAxisPropNames[propName];
    if (propArray) {
      stylesByKey[key].styles +=
        indent +
        hyphenateStyleName(propArray[0]) +
        value +
        indent +
        hyphenateStyleName(propArray[1]) +
        value;
    } else {
      stylesByKey[key].styles += indent + hyphenateStyleName(propName) + value;
    }
  }

  // append media query key
  if (usesMediaQueries) {
    const mqKeys = Object.keys(seenMQs).sort();
    for (let idx = -1, len = mqKeys.length; ++idx < len; ) {
      const mediaQuery = mqKeys[idx];
      classNameKey += `@${mediaQuery}~${seenMQs[mediaQuery]}`;
    }
  }

  if (classNameKey === '') {
    return null;
  }

  if (animations) {
    styleKeyObj.animations = animations;
  }

  styleKeyObj.classNameKey = classNameKey;

  return styleKeyObj;
}
