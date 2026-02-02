import integrationOptions from 'virtual:jsxstyle/config';
import { RequestStyleCache } from '@jsxstyle/core';
import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // server islands are inserted into the page after initial page load, so we
  // use deterministic class names to avoid style conflicts
  const classNameStyle = context.url.pathname.startsWith('/_server-islands/')
    ? 'deterministic'
    : integrationOptions.classNameStyle;

  context.locals.jsxstyleCache = new RequestStyleCache({
    ...integrationOptions,
    classNameStyle,
  });

  return next();
};
