'use strict';

const invariant = require('invariant');
const { _getStyleKeysForProps: getStyleKeysForProps } = require('jsxstyle');

function getClassNameFromCache(
  styleObject,
  cacheObject,
  classNamePrefix = '_x'
) {
  invariant(
    typeof cacheObject === 'object' && cacheObject !== null,
    'getClassNameFromCache expects an object as its second parameter'
  );

  if (!styleObject || typeof styleObject !== 'object') {
    console.warn(
      'getClassNameFromCache received an invalid styleObject as its first parameter'
    );
    return null;
  }

  if (Object.keys(styleObject).length === 0) {
    return null;
  }

  const styleObjects = getStyleKeysForProps(styleObject);
  if (!styleObjects) {
    return null;
  }

  const styleKey = styleObjects.classNameKey;
  const counterKey = classNamePrefix + '~counter';
  cacheObject[counterKey] = cacheObject[counterKey] || 0;
  cacheObject.keys = cacheObject.keys || {};

  const classNameKey = classNamePrefix + '~' + styleKey;
  cacheObject.keys[classNameKey] =
    cacheObject.keys[classNameKey] || (cacheObject[counterKey]++).toString(36);

  return classNamePrefix + cacheObject.keys[classNameKey];
}

module.exports = getClassNameFromCache;
