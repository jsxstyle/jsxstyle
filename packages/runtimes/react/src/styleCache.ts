import { getStyleCache } from '@jsxstyle/core';

/** Shared instance of a style cache object. */
export const styleCache: ReturnType<typeof getStyleCache> = getStyleCache();
