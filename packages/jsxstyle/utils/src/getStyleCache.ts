import { addStyleToHead } from './addStyleToHead';
import { processProps } from './processProps';
import { stringHash } from './stringHash';

type InsertRuleCallback = (
  rule: string,
  props?: Record<string, any>
) => boolean | void;

type GetClassNameFn = (key: string, props?: Record<string, any>) => string;

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

const getStringHash: GetClassNameFn = (key) => {
  return '_' + stringHash(key).toString(36);
};

export function getStyleCache() {
  let cache: Record<string, string> = {};
  let getClassNameForKey: GetClassNameFn = getStringHash;
  let onInsertRule: InsertRuleCallback | undefined = addStyleToHead;

  const memoizedGetClassNameForKey = (key: string): string => {
    return (cache[key] = cache[key] || getClassNameForKey(key));
  };

  const styleCache = {
    reset() {
      cache = {};
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
        onInsertRule
      );
    },
  };

  return styleCache;
}
