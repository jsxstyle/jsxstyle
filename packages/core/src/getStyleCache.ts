import { addStyleToHead } from './addStyleToHead.js';
import { getStringHash } from './getStringHash.js';
import type { GetClassNameForKeyFn } from './processProps.js';
import { processProps } from './processProps.js';
import type { CacheObject } from './types.js';

type InsertRuleCallback = (rule: string) => void;

export interface StyleCacheOptions {
  getClassName?: GetClassNameForKeyFn;
  onInsertRule?: InsertRuleCallback;
}

/**
 * A jsxstyle style cache designed for client-side use.
 * Injects styles directly into the DOM.
 *
 * @example
 * const cache = new StyleCache();
 * // or with custom options:
 * const cache = new StyleCache({
 *   getClassName: (key) => `my-${hash(key)}`,
 *   onInsertRule: (rule) => console.log(rule),
 * });
 */
export class StyleCache {
  #classNameCache: CacheObject = {};
  #insertRuleCache: Record<string, true> = {};
  #getClassNameForKey: GetClassNameForKeyFn;
  #onInsertRule: InsertRuleCallback | undefined;
  #defaultGetClassName: GetClassNameForKeyFn;
  #defaultOnInsertRule: InsertRuleCallback | undefined;
  #canInject = true;

  constructor(options: StyleCacheOptions = {}) {
    this.#defaultGetClassName = options.getClassName ?? getStringHash;
    this.#defaultOnInsertRule = options.onInsertRule ?? addStyleToHead;
    this.#getClassNameForKey = this.#defaultGetClassName;
    this.#onInsertRule = this.#defaultOnInsertRule;
  }

  #memoizedGetClassNameForKey: GetClassNameForKeyFn = (key) => {
    // biome-ignore lint/suspicious/noAssignInExpressions: chill
    return (this.#classNameCache[key] ||= this.#getClassNameForKey(key));
  };

  #memoizedOnInsertRule: InsertRuleCallback = (rule) => {
    if (!this.#onInsertRule || this.#insertRuleCache[rule]) return;
    this.#insertRuleCache[rule] = true;
    this.#onInsertRule(rule);
  };

  /** Reset the cache to its initial state. */
  reset(): void {
    this.#classNameCache = {};
    this.#insertRuleCache = {};
    this.#getClassNameForKey = this.#defaultGetClassName;
    this.#onInsertRule = this.#defaultOnInsertRule;
    this.#canInject = true;
  }

  /** A copy of the current class name cache. */
  get classNameCache(): CacheObject {
    return { ...this.#classNameCache };
  }

  /** A copy of the current insert rule cache. */
  get insertRuleCache(): Record<string, true> {
    return { ...this.#insertRuleCache };
  }

  /**
   * @deprecated Create a new `StyleCache` with options instead.
   * @example
   * // Old approach:
   * cache.injectOptions({ getClassName: myFn });
   *
   * // New approach:
   * const cache = new StyleCache({ getClassName: myFn });
   */
  injectOptions(options: StyleCacheOptions): void {
    if (!this.#canInject) {
      if (
        // @ts-expect-error
        typeof process !== 'undefined' &&
        // @ts-expect-error
        process.env.NODE_ENV !== 'production'
      ) {
        throw new Error(
          'jsxstyle error: `injectOptions` must be called once, before any jsxstyle components mount.'
        );
      }
      throw new Error();
    }
    if (options.getClassName) {
      this.#getClassNameForKey = options.getClassName;
    }
    if (options.onInsertRule) {
      this.#onInsertRule = options.onInsertRule;
    }
    this.#canInject = false;
  }

  /** Insert a CSS rule into the document. */
  insertRule(rule: string): void {
    this.#memoizedOnInsertRule(rule);
  }

  /**
   * Given a synchronous or asynchronous callback, this function executes the
   * callback and collects all styles that were injected as a side effect of
   * the callback running. It returns both the injected styles and the
   * return value of the callback.
   *
   * @deprecated Use `RequestStyleCache` with `flushStyles()` for SSR instead. This method is not concurrent-safe.
   * @example
   * // Old approach (not concurrent-safe):
   * const { css, returnValue } = await cache.run(() => renderToString(<App />));
   *
   * // New approach (concurrent-safe):
   * import { RequestStyleCache } from '@jsxstyle/core';
   * import { JsxstyleCacheProvider } from '@jsxstyle/react';
   *
   * const cache = new RequestStyleCache();
   * const html = renderToString(
   *   <JsxstyleCacheProvider cache={cache}>
   *     <App />
   *   </JsxstyleCacheProvider>
   * );
   * const css = cache.flushStyles();
   */
  async run<T>(
    callback: () => T,
    getClassName?: GetClassNameForKeyFn
  ): Promise<{
    returnValue: Awaited<T>;
    css: string;
  }> {
    let css = '';
    // stash old callbacks
    const oldInsertRuleCallback = this.#onInsertRule;
    const oldGetClassNameCallback = this.#getClassNameForKey;
    this.#insertRuleCache = {};

    // set new callbacks
    if (getClassName) this.#getClassNameForKey = getClassName;
    this.#onInsertRule = (rule) => {
      css += rule;
    };

    // do the thing
    const returnValue = await callback();

    // reset callbacks
    this.#onInsertRule = oldInsertRuleCallback;
    this.#getClassNameForKey = oldGetClassNameCallback;

    return { returnValue, css };
  }

  /**
   * Given an object of component props, this function splits style props and
   * component props, turns style props into CSS, and calls `onInsertRule`
   * for each generated CSS rule.
   * It returns an object of updated component props.
   */
  getComponentProps(
    props: Record<string, any>,
    classNamePropKey: string
  ): Record<string, unknown> | null {
    this.#canInject = false;
    return processProps(
      props,
      classNamePropKey,
      this.#memoizedGetClassNameForKey,
      this.#onInsertRule ? this.#memoizedOnInsertRule : undefined
    );
  }
}

/**
 * Creates a style cache for client-side use.
 *
 * @deprecated Use `new StyleCache()` instead.
 */
export function getStyleCache(options: StyleCacheOptions = {}): StyleCache {
  return new StyleCache(options);
}
