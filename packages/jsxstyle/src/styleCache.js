import getStyleKeysForProps from './getStyleKeysForProps';
import addStyleToHead from './addStyleToHead';
import stringHash from './stringHash';

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

export function resetCache() {
  classNameCache = {};
}

let insertRule;
export function injectAddRule(customAddFunction) {
  insertRule = customAddFunction;
}

let getClassNameForKey = key => '_' + stringHash(key).toString(36);
export function injectClassNameStrategy(customClassNameFunction) {
  getClassNameForKey = customClassNameFunction;
}

export function getClassName(props, classNameProp) {
  const styleObj = getStyleKeysForProps(props);
  if (typeof styleObj !== 'object' || styleObj === null) {
    return classNameProp || null;
  }

  const key = styleObj.classNameKey;
  if (!classNameCache.hasOwnProperty(key)) {
    classNameCache[key] = getClassNameForKey(key);
    delete styleObj.classNameKey;
    Object.keys(styleObj)
      .sort()
      .forEach(k => {
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

        if (
          typeof insertRule === 'function' &&
          // if the function returns nothing, bail.
          typeof insertRule(rule) === 'undefined'
        ) {
          return;
        }
        addStyleToHead(rule);
      });
  }

  return classNameCache[key] && classNameProp
    ? classNameProp + ' ' + classNameCache[key]
    : classNameCache[key] || classNameProp || null;
}
