import { addStyleToHead } from './addStyleToHead';
import { processProps } from './processProps';
import { stringHash } from './stringHash';

type InsertRuleCallback = (
  rule: string,
  props?: Record<string, any>
) => boolean | void;

type GetClassNameFn = (key: string, props?: Record<string, any>) => string;

function cannotInject() {
  throw new Error(
    'jsxstyle error: `injectOptions` must be called before any jsxstyle components mount.'
  );
}

function alreadyInjected() {
  throw new Error(
    'jsxstyle error: `injectOptions` should be called once and only once.'
  );
}

const getStringHash: GetClassNameFn = (key) => {
  return '_' + stringHash(key).toString(36);
};

export function getStyleCache() {
  let _classNameCache: Record<string, string> = {};
  let getClassNameForKey: GetClassNameFn = getStringHash;
  let onInsertRule: InsertRuleCallback;

  const memoizedGetClassNameForKey = (key: string): string => {
    if (!_classNameCache[key]) {
      _classNameCache[key] = getClassNameForKey(key);
    }
    return _classNameCache[key];
  };

  const styleCache = {
    reset() {
      _classNameCache = {};
    },

    injectOptions(options?: {
      onInsertRule?: InsertRuleCallback;
      pretty?: boolean;
      getClassName?: GetClassNameFn;
    }) {
      if (options) {
        if (options.getClassName) {
          getClassNameForKey = options.getClassName;
        }
        if (options.onInsertRule) {
          onInsertRule = options.onInsertRule;
        }
      }
      styleCache.injectOptions = alreadyInjected;
    },

    getComponentProps(
      props: Record<string, any>,
      classNamePropKey = 'className'
    ): Record<string, any> | null {
      styleCache.injectOptions = cannotInject;

      const componentProps = processProps(
        props,
        classNamePropKey,
        memoizedGetClassNameForKey
      );
      if (!componentProps) {
        return null;
      }

      componentProps.rules.forEach((rule) => {
        if (
          onInsertRule &&
          // if the function returns false, bail.
          onInsertRule(rule, props) === false
        ) {
          return;
        }
        addStyleToHead(rule);
      });

      return componentProps.props;
    },
  };

  return styleCache;
}
