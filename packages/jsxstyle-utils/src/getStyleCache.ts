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

if (process.env.NODE_ENV !== 'production') {
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

    injectOptions,
    insertRule: memoizedOnInsertRule,

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
