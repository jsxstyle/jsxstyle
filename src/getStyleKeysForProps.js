'use strict';

const hyphenateStyleName = require('./hyphenateStyleName');
const dangerousStyleValue = require('./dangerousStyleValue');

const prefixCache = {};
// global flag makes subsequent calls of exec advance to the next match
const capRegex = /[A-Z]/g;

const pseudoelements = {
  after: true,
  before: true,
  placeholder: true,
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

function getStyleKeysForProps(props, pretty = false) {
  if (typeof props !== 'object' || props === null) {
    return null;
  }

  const propKeys = Object.keys(props).sort();
  const keyCount = propKeys.length;

  if (keyCount === 0) {
    return null;
  }

  pretty = process.env.NODE_ENV !== 'production';

  const mediaQueries = props.mediaQueries;
  const hasMediaQueries = typeof mediaQueries === 'object';

  // return value
  const styleKeyObj = {};

  for (let idx = -1; ++idx < keyCount; ) {
    const originalPropName = propKeys[idx];

    // jsxstyle special case props
    if (
      originalPropName === 'children' ||
      originalPropName === 'className' ||
      originalPropName === 'component' ||
      originalPropName === 'props' ||
      originalPropName === 'style' ||
      originalPropName === 'mediaQueries'
    ) {
      continue;
    }

    if (!props.hasOwnProperty(originalPropName)) {
      continue;
    }

    let propName = originalPropName;
    let pseudoelement;
    let pseudoclass;
    let mediaQuery;

    if (!prefixCache.hasOwnProperty(originalPropName)) {
      prefixCache[originalPropName] = false;

      capRegex.lastIndex = 0;
      let splitIndex = 0;
      let mediaQueryPrefix;

      let prefix =
        capRegex.test(originalPropName) &&
        capRegex.lastIndex > 1 &&
        originalPropName.slice(0, capRegex.lastIndex - 1);

      // check for media query prefix
      if (prefix && hasMediaQueries && mediaQueries.hasOwnProperty(prefix)) {
        mediaQueryPrefix = prefix;
        mediaQuery = mediaQueries[mediaQueryPrefix];
        splitIndex = capRegex.lastIndex - 1;
        prefix =
          capRegex.test(originalPropName) &&
          originalPropName[splitIndex].toLowerCase() +
            originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
      }

      if (prefix && pseudoelements.hasOwnProperty(prefix)) {
        pseudoelement = prefix;
        splitIndex = capRegex.lastIndex - 1;
        prefix =
          capRegex.test(originalPropName) &&
          originalPropName[splitIndex].toLowerCase() +
            originalPropName.slice(splitIndex + 1, capRegex.lastIndex - 1);
      }

      if (prefix && pseudoclasses.hasOwnProperty(prefix)) {
        pseudoclass = prefix;
        splitIndex = capRegex.lastIndex - 1;
      }

      if (splitIndex > 0) {
        propName =
          originalPropName[splitIndex].toLowerCase() +
          originalPropName.slice(splitIndex + 1);

        prefixCache[originalPropName] = {
          mediaQueryPrefix,
          pseudoelement,
          propName,
          pseudoclass,
        };
      }
    } else if (typeof prefixCache[originalPropName] === 'object') {
      propName = prefixCache[originalPropName].propName;
      pseudoclass = prefixCache[originalPropName].pseudoclass;
      pseudoelement = prefixCache[originalPropName].placeholder;
      const mediaQueryPrefix = prefixCache[originalPropName].mediaQueryPrefix;
      if (hasMediaQueries && mediaQueries.hasOwnProperty(mediaQueryPrefix)) {
        mediaQuery = mediaQueries[mediaQueryPrefix];
      }
    }

    // key by pseudoclass and media query
    const key =
      (pseudoclass || 'normal') +
      (pseudoelement ? '~' + pseudoelement : '') +
      (mediaQuery ? '~' + mediaQuery : '');

    if (!styleKeyObj.hasOwnProperty(key)) {
      styleKeyObj[key] = { css: pretty ? '\n' : '' };
      if (mediaQuery) styleKeyObj[key].mediaQuery = mediaQuery;
      if (pseudoclass) styleKeyObj[key].pseudoclass = pseudoclass;
      if (pseudoelement) styleKeyObj[key].pseudoelement = pseudoelement;
    }

    styleKeyObj[key].css +=
      (pretty ? '  ' : '') +
      hyphenateStyleName(propName) +
      ':' +
      dangerousStyleValue(propName, props[originalPropName]) +
      ';' +
      (pretty ? '\n' : '');
  }

  return styleKeyObj;
}

module.exports = getStyleKeysForProps;
