import { stringHash } from './stringHash';

export const getStringHash = (key: string): string => {
  return '_' + stringHash(key).toString(36);
};
