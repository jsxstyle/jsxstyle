'use strict';

const getStyleKeysForProps = require('./getStyleKeysForProps');
const addStyleToHead = require('./addStyleToHead');
const stringHash = require('./stringHash');

let classNameCache;
if (module.hot) {
  if (typeof module.hot.data === 'object') {
    classNameCache = module.hot.data.classNameCache;
  }

  module.hot.addDisposeHandler(function(data) {
    data.classNameCache = classNameCache;
  });
}

if (!classNameCache) {
  classNameCache = {};
}

function resetCache() {
  classNameCache = {};
}

let insertRule = addStyleToHead;
function injectAddRule(customAddFunction) {
  insertRule = customAddFunction;
}

let getClassNameForKey = key => '_' + stringHash(key).toString(36);
function injectClassNameStrategy(customClassNameFunction) {
  getClassNameForKey = customClassNameFunction;
}

function getClassName(props, classNameProp) {
  const styleObj = getStyleKeysForProps(props);
  if (typeof styleObj !== 'object' || styleObj === null) {
    return classNameProp || null;
  }

  const key = styleObj.classNameKey;
  if (!classNameCache.hasOwnProperty(key)) {
    classNameCache[key] = getClassNameForKey(key);
    delete styleObj.classNameKey;
    Object.keys(styleObj).sort().forEach(k => {
      const selector = '.' + classNameCache[key];
      const { pseudoclass, pseudoelement, mediaQuery, styles } = styleObj[k];

      let rule =
        selector +
        (pseudoclass ? ':' + pseudoclass : '') +
        (pseudoelement ? '::' + pseudoelement : '') +
        ` {${styles}}`;

      if (mediaQuery) {
        rule = `@media ${mediaQuery} { ${rule} }`;
      }

      insertRule(rule);
    });
  }

  return classNameCache[key] && classNameProp
    ? classNameProp + ' ' + classNameCache[key]
    : classNameCache[key] || classNameProp || null;
}

module.exports = {
  getClassName,
  injectAddRule,
  injectClassNameStrategy,
  resetCache,
};
