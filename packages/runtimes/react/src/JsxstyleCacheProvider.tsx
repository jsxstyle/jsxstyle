'use client';

import {
  RequestStyleCache,
  type RequestStyleCacheOptions,
  cacheSingleton,
} from '@jsxstyle/core';
import { createContext, useMemo } from 'react';

/**
 * Interface for style caches compatible with jsxstyle components.
 */
export interface JsxstyleCache {
  getComponentProps(
    props: Record<string, any>,
    /**
     * A string like `class` or `className`.
     * This prop will be present in the returned object if style props are present in `props`.
     */
    classNamePropKey: string
  ): Record<string, unknown> | null;
}

/**
 * Context for providing a style cache to jsxstyle components.
 * Defaults to the global cacheSingleton. Use JsxstyleCacheProvider
 * with a request-scoped cache for concurrent SSR.
 */
export const JsxstyleCacheContext =
  createContext<JsxstyleCache>(cacheSingleton);

interface JsxstyleCacheProviderCacheProps
  extends Partial<Record<keyof RequestStyleCacheOptions, never>> {
  cache: JsxstyleCache;
  classNamePrefix?: never;
  classNameStyle?: never;
}

interface JsxstyleCacheProviderClassNameProps extends RequestStyleCacheOptions {
  cache?: never;
}

export type JsxstyleCacheProviderProps = React.PropsWithChildren<
  JsxstyleCacheProviderCacheProps | JsxstyleCacheProviderClassNameProps
>;

/**
 * Provider for supplying a style cache to jsxstyle components.
 *
 * @example
 * // Pass an existing cache (for SSR when you need flushStyles())
 * const cache = new RequestStyleCache();
 * <JsxstyleCacheProvider cache={cache}>
 *   <App />
 * </JsxstyleCacheProvider>
 * const css = cache.flushStyles();
 *
 * @example
 * // Pass options to create an internal memoized cache
 * <JsxstyleCacheProvider classNamePrefix="_my">
 *   <App />
 * </JsxstyleCacheProvider>
 */
export function JsxstyleCacheProvider(props: JsxstyleCacheProviderProps) {
  const { children, cache, classNamePrefix, classNameStyle } = props;

  const internalCache = useMemo(() => {
    if (cache) return cache;
    return new RequestStyleCache({ classNameStyle, classNamePrefix });
  }, [cache, classNamePrefix, classNameStyle]);

  return (
    <JsxstyleCacheContext.Provider value={internalCache}>
      {children}
    </JsxstyleCacheContext.Provider>
  );
}
