import { createRequestStyleCache } from '@jsxstyle/core';
import type { MiddlewareHandler } from 'astro';

const cache = createRequestStyleCache();
export const onRequest: MiddlewareHandler = async (context, next) => {
  context.locals.jsxstyleCache = cache;
  // reset the list of inserted styles before each request
  cache.reset();
  return next();
};
