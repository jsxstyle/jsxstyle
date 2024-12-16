import { stringHash } from './stringHash.js';

export const getStringHash = (key: string): string => {
  return '_' + stringHash(key).toString(36);
};
