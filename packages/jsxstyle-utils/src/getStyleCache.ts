import type { CacheObject } from './types';
import { addStyleToHead } from './addStyleToHead';
import { getStringHash } from './getStringHash';
import { processProps, type GetClassNameForKeyFn } from './processProps';

type InsertRuleCallback = (rule: string) => void;

const throwProdError = () => {
  throw new Error();
};

let cannotInject = throwProdError;
let alreadyInjected = throwProdError;

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  cannotInject = () => {
    throw new Error(
      'jsxstyle error: `injectOptions` must be called before any jsxstyle components mount.'
    );
  };

  alreadyInjected = () => {
    throw new Error(
      'jsxstyle error: `injectOptions` should be called once and only once.'
    );
  };
}

export type StyleCache = ReturnType<typeof getStyleCache>;

export interface StyleCacheOptions {
  getClassName?: GetClassNameForKeyFn;
  onInsertRule?: InsertRuleCallback;
}

export function getStyleCache({
  getClassName: defaultGetClassName = getStringHash,
  onInsertRule: defaultOnInsertRule = addStyleToHead,
}: StyleCacheOptions = {}) {
  let classNameCache: CacheObject = {};
  let insertRuleCache: Record<string, true> = {};
  let getClassNameForKey: GetClassNameForKeyFn = defaultGetClassName;
  let onInsertRule: InsertRuleCallback | undefined = defaultOnInsertRule;

  const memoizedGetClassNameForKey: GetClassNameForKeyFn = (key) => {
    return (classNameCache[key] ||= getClassNameForKey(key));
  };

  const memoizedOnInsertRule: InsertRuleCallback = (rule) => {
    if (!onInsertRule || insertRuleCache[rule]) return;
    insertRuleCache[rule] = true;
    onInsertRule(rule);
  };

  const injectOptions = (options: StyleCacheOptions) => {
    if (options.getClassName) {
      getClassNameForKey = options.getClassName;
    }
    onInsertRule = options.onInsertRule;
    styleCache.injectOptions = alreadyInjected;
  };

  const styleCache = {
    reset() {
      classNameCache = {};
      insertRuleCache = {};
      getClassNameForKey = defaultGetClassName;
      onInsertRule = defaultOnInsertRule;
      styleCache.injectOptions = injectOptions;
    },

    get classNameCache() {
      return { ...classNameCache };
    },

    get insertRuleCache() {
      return { ...insertRuleCache };
    },

    injectOptions,
    insertRule: memoizedOnInsertRule,

    /**
     * Given a synchronous or asynchronous callback, this functions execute the
     * callback and collects all styles that were injected as a side effect of
     * the callback running. It returns both the injected styles and the
     * return value of the callback.
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
      const oldInsertRuleCallback = onInsertRule;
      const oldGetClassNameCallback = getClassNameForKey;
      insertRuleCache = {};

      // set new callbacks
      if (getClassName) getClassNameForKey = getClassName;
      onInsertRule = (rule) => void (css += rule);

      // do the thing
      const returnValue = await callback();

      // reset callbacks
      onInsertRule = oldInsertRuleCallback;
      getClassNameForKey = oldGetClassNameCallback;

      return { returnValue, css };
    },

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
      styleCache.injectOptions = cannotInject;
      return processProps(
        props,
        classNamePropKey,
        memoizedGetClassNameForKey,
        onInsertRule ? memoizedOnInsertRule : undefined
      );
    },
  };

  return styleCache;
}
