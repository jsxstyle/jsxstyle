import type { GetClassNameForKeyFn } from './processProps.js';
import { stringHash } from './stringHash.js';
import type { CacheObject } from './types.js';

export const createClassNameGetter = (
  cacheObject: CacheObject,
  classNameFormat?: 'hash'
): GetClassNameForKeyFn => {
  let getClassName: (key: string) => string;

  if (classNameFormat === 'hash') {
    // content hash
    getClassName = (key: string) => '_' + stringHash(key).toString(36);
  } else {
    // incrementing integer
    const counterKey = Symbol.for('counter');
    cacheObject[counterKey] = cacheObject[counterKey] || 0;
    // biome-ignore lint/style/noNonNullAssertion:
    getClassName = () => '_x' + (cacheObject[counterKey]!++).toString(36);
  }

  return (key) => {
    // biome-ignore lint/suspicious/noAssignInExpressions: chill
    return (cacheObject[key] = cacheObject[key] || getClassName(key));
  };
};
