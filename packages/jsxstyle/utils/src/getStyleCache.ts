import type { CacheObject } from 'jsxstyle/webpack-plugin/src/types';
import { addStyleToHead } from './addStyleToHead';
import { getStringHash } from './getStringHash';
import { processProps, type GetClassNameForKeyFn } from './processProps';

type InsertRuleCallback = (rule: string, key: string) => void;

type GetClassNameFn = (key: string) => string;

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

export function getStyleCache() {
  let classNameCache: CacheObject = {};
  let insertRuleCache: Record<string, true> = {};
  let getClassNameForKey: GetClassNameFn = getStringHash;
  let onInsertRule: InsertRuleCallback | undefined = addStyleToHead;

  const memoizedGetClassNameForKey: GetClassNameForKeyFn = (key) => {
    return (classNameCache[key] =
      classNameCache[key] || getClassNameForKey(key));
  };

  const memoizedOnInsertRule: InsertRuleCallback = (rule, key) => {
    if (!onInsertRule || insertRuleCache[key]) return;
    insertRuleCache[key] = true;
    onInsertRule(rule, key);
  };

  const styleCache = {
    reset() {
      classNameCache = {};
      insertRuleCache = {};
    },

    injectOptions(options: {
      onInsertRule?: InsertRuleCallback;
      getClassName?: GetClassNameFn;
    }) {
      if (options.getClassName) {
        getClassNameForKey = options.getClassName;
      }
      onInsertRule = options.onInsertRule;
      styleCache.injectOptions = alreadyInjected;
    },

    getComponentProps(
      props: Record<string, any>,
      classNamePropKey = 'className'
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
