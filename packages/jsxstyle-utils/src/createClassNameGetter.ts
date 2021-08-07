import { stringHash } from './stringHash';

export const createClassNameGetter = (
  cacheObject: Record<string, any>,
  classNameFormat?: 'hash'
) => {
  let getClassName: (key: string) => string;

  if (classNameFormat === 'hash') {
    // content hash
    getClassName = (key: string) => '_' + stringHash(key).toString(36);
  } else {
    // incrementing integer
    const counterKey: any = Symbol.for('counter');
    cacheObject[counterKey] = cacheObject[counterKey] || 0;
    getClassName = () => '_x' + (cacheObject[counterKey]++).toString(36);
  }

  return (key: string) => {
    return (cacheObject[key] = cacheObject[key] || getClassName(key));
  };
};
