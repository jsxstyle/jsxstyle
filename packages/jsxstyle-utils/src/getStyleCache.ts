import getStyleKeysForProps from './getStyleKeysForProps';
import addStyleToHead from './addStyleToHead';
import stringHash from './stringHash';
import { Dict } from './types';

type InsertRuleCallback = (rule: string, props?: {}) => boolean | void;

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

function getStringHash(key: string, props: {}): string;
function getStringHash(key: string): string {
  return '_' + stringHash(key).toString(36);
}

export default function getStyleCache() {
  let _classNameCache: Dict<string> = {};
  let getClassNameForKey = getStringHash;
  let onInsertRule: InsertRuleCallback;
  let pretty = false;

  const styleCache = {
    reset() {
      _classNameCache = {};
    },

    injectOptions(options: {
      getClassName(key: string, props?: {}): string;
      onInsertRule: InsertRuleCallback;
      pretty: boolean;
    }) {
      if (options) {
        if (options.getClassName) getClassNameForKey = options.getClassName;
        if (options.onInsertRule) onInsertRule = options.onInsertRule;
        if (options.pretty) pretty = options.pretty;
      }
      styleCache.injectOptions = alreadyInjected;
    },

    getClassName(props: Dict<any>, classNameProp?: string): string | null {
      styleCache.injectOptions = cannotInject;

      const styleObj = getStyleKeysForProps(props, pretty);
      if (typeof styleObj !== 'object' || styleObj === null) {
        return classNameProp || null;
      }

      const key = styleObj.classNameKey;
      if (key && !_classNameCache.hasOwnProperty(key)) {
        _classNameCache[key] = getClassNameForKey(key, props);
        delete styleObj.classNameKey;
        Object.keys(styleObj)
          .sort()
          .forEach(k => {
            const selector = '.' + _classNameCache[key];
            // prettier-ignore
            const { pseudoclass, pseudoelement, mediaQuery, styles } = styleObj[k];

            let rule =
              selector +
              (pseudoclass ? ':' + pseudoclass : '') +
              (pseudoelement ? '::' + pseudoelement : '') +
              ` {${styles}}`;

            if (mediaQuery) {
              rule = `@media ${mediaQuery} { ${rule} }`;
            }

            if (
              onInsertRule &&
              // if the function returns false, bail.
              onInsertRule(rule, props) === false
            ) {
              return;
            }
            addStyleToHead(rule);
          });
      }

      return _classNameCache[key] && classNameProp
        ? classNameProp + ' ' + _classNameCache[key]
        : _classNameCache[key] || classNameProp || null;
    },
  };

  return styleCache;
}
