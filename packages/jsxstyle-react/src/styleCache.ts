import { getStyleCache } from '../../jsxstyle-utils/src';

/** Shared instance of a style cache object. */
export const styleCache: ReturnType<typeof getStyleCache> = getStyleCache();
