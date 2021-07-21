import { addStyleToHead } from './addStyleToHead';
import { getStyleKeysForProps } from './getStyleKeysForProps';
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
  let pretty = false;

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
        if (options.pretty) {
          pretty = options.pretty;
        }
      }
      styleCache.injectOptions = alreadyInjected;
    },

    getComponentProps(
      props: Record<string, any>,
      classNamePropKey = 'className'
    ): Record<string, any> | null {
      styleCache.injectOptions = cannotInject;

      const styleObj = getStyleKeysForProps(props, classNamePropKey, pretty);
      if (styleObj == null) {
        return null;
      }

      const key = styleObj.classNameKey;
      if (key && !_classNameCache.hasOwnProperty(key)) {
        _classNameCache[key] = getClassNameForKey(key, props);
        Object.keys(styleObj.stylesByKey)
          .sort()
          .forEach((k) => {
            const selector = '.' + _classNameCache[key];
            // prettier-ignore
            const { pseudoclass, pseudoelement, mediaQuery, styles } = styleObj.stylesByKey[k];

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

      const animations = styleObj.animations;
      if (animations) {
        for (const animationKey in animations) {
          const rule = `@keyframes ${animationKey} {${animations[animationKey]}}`;
          if (!onInsertRule || onInsertRule(rule, props) !== false) {
            addStyleToHead(rule);
          }
        }
      }

      const classNameProp = props[classNamePropKey];

      const classNameForKey = key && _classNameCache[key];

      const className =
        classNameForKey && classNameProp
          ? classNameProp + ' ' + classNameForKey
          : classNameForKey || classNameProp || null;

      const finalProps = { ...styleObj.props };
      if (className) {
        finalProps[classNamePropKey] = className;
      }

      return finalProps;
    },
  };

  return styleCache;
}
