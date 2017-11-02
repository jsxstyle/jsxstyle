'use strict';

const invariant = require('invariant');
const { getStyleKeysForProps, stringHash } = require('jsxstyle-utils');

function getClassNameFromCache(styleObject, cacheObject, deterministic) {
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

  const classNameKey = styleObjects.classNameKey;
  const counterKey = Symbol.for('counter');
  cacheObject[counterKey] = cacheObject[counterKey] || 0;

  if (!cacheObject[classNameKey]) {
    if (deterministic) {
      // content hash
      cacheObject[classNameKey] = stringHash(classNameKey).toString(26);
    } else {
      // incrementing integer
      cacheObject[classNameKey] = (cacheObject[counterKey]++).toString(36);
    }
  }

  return '_x' + cacheObject[classNameKey];
}

module.exports = getClassNameFromCache;
