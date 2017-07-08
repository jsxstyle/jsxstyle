'use strict';

const hyphenateStyleName = require('./hyphenateStyleName');
const dangerousStyleValue = require('./dangerousStyleValue');

const prefixCache = {};
// global flag makes subsequent calls of exec advance to the next match
const capRegex = /[A-Z]/g;

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

    const propValue = dangerousStyleValue(propName, props[originalPropName]);

    if (propValue == null || propValue === '') {
      continue;
    }

    let pseudoclass;
    let mediaQuery;
    let propName = originalPropName;

    if (!prefixCache.hasOwnProperty(originalPropName)) {
      prefixCache[originalPropName] = false;
      capRegex.lastIndex = 0;
      let splitIndex;
      let mediaQueryPrefix;

      const match1 = capRegex.exec(originalPropName);
      if (match1 && match1.index > 0) {
        const prefix1 = originalPropName.slice(0, match1.index);
        if (
          prefix1 === 'active' ||
          prefix1 === 'focus' ||
          prefix1 === 'hover' ||
          prefix1 === 'placeholder'
        ) {
          pseudoclass = prefix1;
          splitIndex = match1.index;
        } else if (hasMediaQueries && mediaQueries.hasOwnProperty(prefix1)) {
          mediaQueryPrefix = prefix1;
          mediaQuery = mediaQueries[mediaQueryPrefix];
          splitIndex = match1.index;

          const match2 = capRegex.exec(originalPropName);
          if (match2 && match2.index > match1.index + 1) {
            const prefix2 = originalPropName.slice(match1.index, match2.index);
            if (
              prefix2 === 'Active' ||
              prefix2 === 'Focus' ||
              prefix2 === 'Hover' ||
              prefix2 === 'Placeholder'
            ) {
              pseudoclass = prefix2.toLowerCase();
              splitIndex = match2.index;
            }
          }
        }

        if (typeof splitIndex === 'number') {
          propName =
            originalPropName[splitIndex].toLowerCase() +
            originalPropName.slice(splitIndex + 1);

          prefixCache[originalPropName] = {
            propName,
            mediaQueryPrefix,
            pseudoclass:
              pseudoclass === 'placeholder' ? ':' + pseudoclass : pseudoclass,
          };
        }
      }
    } else if (typeof prefixCache[originalPropName] === 'object') {
      pseudoclass = prefixCache[originalPropName].pseudoclass;
      const mediaQueryPrefix = prefixCache[originalPropName].mediaQueryPrefix;
      if (hasMediaQueries && mediaQueries.hasOwnProperty(mediaQueryPrefix)) {
        mediaQuery = mediaQueries[mediaQueryPrefix];
      }
      propName = prefixCache[originalPropName].propName;
    }

    // key by pseudoclass and media query
    const key =
      (pseudoclass || 'normal') + (mediaQuery ? '~' + mediaQuery : '');

    if (!styleKeyObj.hasOwnProperty(key)) {
      styleKeyObj[key] = { css: pretty ? '\n' : '' };
      if (pseudoclass) styleKeyObj[key].pseudoclass = pseudoclass;
      if (mediaQuery) styleKeyObj[key].mediaQuery = mediaQuery;
    }

    styleKeyObj[key].css +=
      (pretty ? '  ' : '') +
      hyphenateStyleName(propName) +
      ':' +
      propValue +
      ';' +
      (pretty ? '\n' : '');
  }

  return styleKeyObj;
}

module.exports = getStyleKeysForProps;
