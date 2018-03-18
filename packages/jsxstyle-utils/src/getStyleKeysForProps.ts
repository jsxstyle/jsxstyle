import hyphenateStyleName from './hyphenateStyleName';
import dangerousStyleValue from './dangerousStyleValue';
import { Dict, CSSProperties } from '../jsxstyle-utils';

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
  required: true,
  target: true,
  valid: true,
};

const specialCaseProps = {
  children: true,
  class: true,
  className: true,
  component: true,
  props: true,
  style: true,
  mediaQueries: true,
};

export type StyleKeyObj = Dict<{
  styles: string;
  mediaQuery?: string;
  pseudoclass?: string;
  pseudoelement?: string;
}> & { classNameKey: string };

export default function getStyleKeysForProps(
  props: CSSProperties & { mediaQueries?: Dict<string> },
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
  const hasMediaQueries = typeof mediaQueries === 'object';
  let usesMediaQueries = false;

  const styleKeyObj = {} as StyleKeyObj;

  let classNameKey = '';
  const seenMQs: Dict<string> = {};

  const mqSortKeys: Dict<string> = {};
  if (hasMediaQueries) {
    let idx = -1;
    for (const k in mediaQueries!) {
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
    if (prefix && hasMediaQueries && mediaQueries!.hasOwnProperty(prefix)) {
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

    const styleValue = dangerousStyleValue(propName, props[originalPropName]);
    if (styleValue === '') {
      continue;
    }

    const mediaQuery = mqKey && mediaQueries![mqKey];
    const mqSortKey = mqKey && mqSortKeys[mqKey];

    const key =
      '.' +
      (mqSortKey || '') +
      (pseudoclass ? ':' + pseudoclass : '') +
      (pseudoelement ? '::' + pseudoelement : '');

    if (!styleKeyObj.hasOwnProperty(key)) {
      styleKeyObj[key] = { styles: pretty ? '\n' : '' };
      if (mediaQuery) styleKeyObj[key].mediaQuery = mediaQuery;
      if (pseudoclass) styleKeyObj[key].pseudoclass = pseudoclass;
      if (pseudoelement) styleKeyObj[key].pseudoelement = pseudoelement;
    }

    if (mediaQuery) {
      seenMQs[mediaQuery] = seenMQs[mediaQuery] || '';
      seenMQs[mediaQuery] += propSansMQ + ':' + styleValue + ';';
    } else {
      classNameKey += originalPropName + ':' + styleValue + ';';
    }

    styleKeyObj[key].styles +=
      (pretty ? '  ' : '') +
      hyphenateStyleName(propName) +
      (pretty ? ': ' : ':') +
      styleValue +
      (pretty ? ';\n' : ';');
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

  styleKeyObj.classNameKey = classNameKey;

  return styleKeyObj;
}
