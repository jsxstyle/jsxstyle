import getStyleKeysForProps from './getStyleKeysForProps';
import addStyleToHead from './addStyleToHead';
import stringHash from './stringHash';

function cannotInject() {
  throw new Error(
    'jsxstyle error: injection functions must be called before any jsxstyle components mount.'
  );
}

function alreadyInjected() {
  throw new Error(
    'jsxstyle error: injection functions should be called once and only once.'
  );
}

function getStringHash(key) {
  return '_' + stringHash(key).toString(36);
}

export default function getStyleCache() {
  let _classNameCache = {};
  let insertRule = null;
  let getClassNameForKey = getStringHash;

  const styleCache = {};

  styleCache.reset = () => {
    _classNameCache = {};
  };

  styleCache.injectAddRule = customAddFunction => {
    insertRule = customAddFunction;
    styleCache.injectAddRule = alreadyInjected;
  };

  styleCache.injectClassNameStrategy = customClassNameFunction => {
    getClassNameForKey = customClassNameFunction;
    styleCache.injectClassNameStrategy = alreadyInjected;
  };

  styleCache.getClassName = (props, classNameProp) => {
    styleCache.injectAddRule = cannotInject;
    styleCache.injectClassNameStrategy = cannotInject;

    const styleObj = getStyleKeysForProps(props);
    if (typeof styleObj !== 'object' || styleObj === null) {
      return classNameProp || null;
    }

    const key = styleObj.classNameKey;
    if (!_classNameCache.hasOwnProperty(key)) {
      _classNameCache[key] = getClassNameForKey(key, props);
      delete styleObj.classNameKey;
      Object.keys(styleObj)
        .sort()
        .forEach(k => {
          const selector = '.' + _classNameCache[key];
          // prettier-ignore
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

    return _classNameCache[key] && classNameProp
      ? classNameProp + ' ' + _classNameCache[key]
      : _classNameCache[key] || classNameProp || null;
  };

  return styleCache;
}
