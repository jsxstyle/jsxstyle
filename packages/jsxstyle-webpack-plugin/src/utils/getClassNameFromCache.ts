import {
  CSSProperties,
  getStyleKeysForProps,
  stringHash,
} from 'jsxstyle-utils';

import type { CacheObject } from '../types';

export function getClassNameFromCache(
  styleObject: CSSProperties,
  cacheObject: CacheObject,
  classNamePropKey: string,
  classNameFormat?: 'hash'
): string | null {
  if (cacheObject == null) {
    throw new Error(
      'getClassNameFromCache expects an object as its second parameter'
    );
  }

  if (!styleObject || typeof styleObject !== 'object') {
    console.warn(
      'getClassNameFromCache received an invalid styleObject as its first parameter'
    );
    return null;
  }

  if (Object.keys(styleObject).length === 0) {
    return null;
  }

  const styleObjects = getStyleKeysForProps(styleObject, classNamePropKey);
  if (!styleObjects) {
    return null;
  }

  const classNameKey = styleObjects.classNameKey;
  if (classNameKey === null) {
    return null;
  }

  const counterKey: any = Symbol.for('counter');
  cacheObject[counterKey] = cacheObject[counterKey] || 0;

  if (!cacheObject[classNameKey]) {
    if (classNameFormat === 'hash') {
      // content hash
      cacheObject[classNameKey] = '_' + stringHash(classNameKey).toString(36);
    } else {
      // incrementing integer
      cacheObject[classNameKey] =
        '_x' + (cacheObject[counterKey]++).toString(36);
    }
  }

  return cacheObject[classNameKey];
}
