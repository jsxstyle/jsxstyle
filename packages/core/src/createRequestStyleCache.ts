import type { GetClassNameForKeyFn } from './processProps.js';
import { processProps } from './processProps.js';
import { stringHash } from './stringHash.js';
import type { CacheObject } from './types.js';

export interface RequestStyleCacheOptions {
  /**
   * Class name styles:
   * - `"short"`: 3-4 characters, non-deterministic
   * - `"deterministic"`: 7-10 characters
   */
  classNameStyle?: 'short' | 'deterministic';
  /** Prefix for generated `"short"` class names. Defaults to `_x`. */
  classNamePrefix?: string;
}

/**
 * A jsxstyle style cache designed to be used in a server environment,
 *   scoped to a single request.
 *
 * @example
 * const cache = new RequestStyleCache();
 * const html = renderToString(
 *   <JsxstyleCacheProvider cache={cache}>
 *     <App />
 *   </JsxstyleCacheProvider>
 * );
 * const css = cache.flushStyles();
 * res.send(`<style>${css}</style>${html}`);
 */
export class RequestStyleCache {
  #classNameCache: CacheObject = {};
  #rules = new Set<string>();
  #styleBuffer = '';
  #getClassName: GetClassNameForKeyFn;

  constructor(options?: RequestStyleCacheOptions) {
    const classNamePrefix = options?.classNamePrefix || '_x';
    const classNameStyle = options?.classNameStyle || 'short';
    let index = 0;
    this.#getClassName =
      classNameStyle === 'deterministic'
        ? (key) => `_${stringHash(key).toString(36)}`
        : () => `${classNamePrefix}${(index++).toString(36)}`;
  }

  /**
   * Given an object of component props, this function extracts style props into CSS rules.
   * Non-style props are returned as-is. A `classNamePropKey` prop is added to the
   * returned object if styles were extracted.
   */
  getComponentProps(
    props: Record<string, any>,
    classNamePropKey: string
  ): Record<string, unknown> | null {
    return processProps(
      props,
      classNamePropKey,
      (key) => {
        // biome-ignore lint/suspicious/noAssignInExpressions: chill
        return (this.#classNameCache[key] ||= this.#getClassName(key));
      },
      (rule) => {
        if (!this.#rules.has(rule)) {
          this.#rules.add(rule);
          this.#styleBuffer += rule;
        }
      }
    );
  }

  /** Returns collected CSS since last flush and clears the buffer. */
  flushStyles(): string {
    const css = this.#styleBuffer;
    this.#styleBuffer = '';
    return css;
  }

  /**
   * Reset the inserted rule cache. This allows already-seen rules to be
   * reinserted into the document.
   *
   * The class name cache will not be reset in order to keep class names deterministic.
   */
  reset(): void {
    this.#rules.clear();
    this.#styleBuffer = '';
  }
}

/**
 * Creates a style cache scoped to a single request.
 *
 * @deprecated Use `new RequestStyleCache()` instead.
 */
export function createRequestStyleCache(
  options?: RequestStyleCacheOptions
): RequestStyleCache {
  return new RequestStyleCache(options);
}
