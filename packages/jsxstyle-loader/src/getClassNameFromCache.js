'use strict';

const invariant = require('invariant');
const getStyleKeysForProps = require('jsxstyle/lib/getStyleKeysForProps');

function getClassNameFromCache(
  styleObject,
  cacheObject,
  classNamePrefix = '_x'
) {
  invariant(
    typeof cacheObject === 'object' && cacheObject !== null,
    'getClassNameFromCache expects an object as its second parameter'
  );

  if (!styleObject || typeof styleObject !== 'object' || styleObject === null) {
    console.warn(
      'getClassNameFromCache received an invalid styleObject as its first parameter'
    );
    return null;
  }

  if (Object.keys(styleObject).length === 0) {
    return null;
  }

  const styleObjects = getStyleKeysForProps(styleObject);
  const styleKey = styleObjects.classNameKey;

  if (styleKey === '' || styleKey == null) {
    return null;
  }

  const counterKey = classNamePrefix + '~counter';
  cacheObject[counterKey] = cacheObject[counterKey] || 0;
  cacheObject.keys = cacheObject.keys || {};

  const classNameKey = classNamePrefix + '~' + styleKey;
  cacheObject.keys[classNameKey] =
    cacheObject.keys[classNameKey] || (cacheObject[counterKey]++).toString(36);

  return classNamePrefix + cacheObject.keys[classNameKey];
}

module.exports = getClassNameFromCache;
