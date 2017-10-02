import hyphenateStyleName from './hyphenateStyleName';
import dangerousStyleValue from './dangerousStyleValue';

// global flag makes subsequent calls of capRegex.test advance to the next match
const capRegex = /[A-Z]/g;

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

export default function getStyleKeysForProps(props, pretty = false) {
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

  // return value
  const styleKeyObj = {};
  let classNameKey = '';

  const mqSortKeys = {};
  if (hasMediaQueries) {
    let idx = -1;
    for (const k in mediaQueries) {
      mqSortKeys[k] = 1000 + ++idx;
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

    let propName = originalPropName;
    let pseudoelement;
    let pseudoclass;
    let mediaQuery;
    let mqSortKey;

    capRegex.lastIndex = 0;
    let splitIndex = 0;

    let prefix =
      capRegex.test(originalPropName) &&
      capRegex.lastIndex > 1 &&
      originalPropName.slice(0, capRegex.lastIndex - 1);

    // check for media query prefix
    if (prefix && hasMediaQueries && mediaQueries.hasOwnProperty(prefix)) {
      mediaQuery = mediaQueries[prefix];
      mqSortKey = mqSortKeys[prefix];
      splitIndex = capRegex.lastIndex - 1;
      prefix =
        capRegex.test(originalPropName) &&
        originalPropName[splitIndex].toLowerCase() +
          originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
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

    const key =
      '.' +
      (mediaQuery ? '@' + mqSortKey : '') +
      (pseudoclass ? ':' + pseudoclass : '') +
      (pseudoelement ? '::' + pseudoelement : '');

    if (!styleKeyObj.hasOwnProperty(key)) {
      styleKeyObj[key] = { styles: pretty ? '\n' : '' };
      if (mediaQuery) styleKeyObj[key].mediaQuery = mediaQuery;
      if (pseudoclass) styleKeyObj[key].pseudoclass = pseudoclass;
      if (pseudoelement) styleKeyObj[key].pseudoelement = pseudoelement;
    }

    classNameKey += originalPropName + ':' + styleValue + ';';
    styleKeyObj[key].styles +=
      (pretty ? '  ' : '') +
      hyphenateStyleName(propName) +
      (pretty ? ': ' : ':') +
      styleValue +
      (pretty ? ';\n' : ';');
  }

  if (classNameKey === '') {
    return null;
  }

  styleKeyObj.classNameKey = classNameKey;

  return styleKeyObj;
}
