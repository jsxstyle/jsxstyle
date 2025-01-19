import { parseStyleProps } from './parseStyleProps.js';
import type { GetClassNameForKeyFn } from './processProps.js';
import { processProps } from './processProps.js';
import { stringHash } from './stringHash.js';
import type { CacheObject } from './types.js';

export type RequestStyleCache = ReturnType<typeof createRequestStyleCache>;

interface RequestStyleCacheOptions {
  classNamePrefix?: string;
  classNamePropKey: string;
  classNameStyle?: 'deterministic' | 'short';
}

/**
 * This function creates a style cache that is designed to live for a single request.
 * It should be used in a non-SPA server environment.
 */
export function createRequestStyleCache({
  classNamePrefix = '_x',
  classNamePropKey,
  classNameStyle = 'short',
}: RequestStyleCacheOptions) {
  let index = 0;

  const getClassName: GetClassNameForKeyFn =
    classNameStyle === 'deterministic'
      ? (key) => `_${stringHash(key).toString(36)}`
      : () => `${classNamePrefix}${(index++).toString(36)}`;

  const classNameCache: CacheObject = {};
  const rules = new Set<string>();

  const styleCache = {
    /**
     * Given an object of component props, this function splits style props and
     * component props, turns style props into CSS, and calls `onInsertRule`
     * for each generated CSS rule.
     *
     * It returns an object of updated component props and a string of styles
     * that should be inserted into the document. Only new styles are returned
     */
    getComponentProps(props: Record<string, any>): {
      props: Record<string, unknown> | null;
      styles: string;
    } {
      let styles = '';
      const parsed = parseStyleProps(props);
      const className = processProps(
        parsed.parsedStyleProps,
        parsed.componentProps,
        (key) => {
          // biome-ignore lint/suspicious/noAssignInExpressions: chill
          return (classNameCache[key] ||= getClassName(key));
        },
        (rule) => {
          if (!rules.has(rule)) {
            rules.add(rule);
            styles += rule;
          }
        }
      );
      const componentProps = { ...parsed.componentProps };
      if (className) {
        componentProps[classNamePropKey] = className;
      }
      return {
        props: componentProps,
        styles,
      };
    },

    /**
     * Reset the inserted rule cache. This allows already-seen rules to be
     * reinserted into the document.
     *
     * The class name cache will not be reset. This keeps class names deterministic.
     */
    reset() {
      rules.clear();
    },
  };

  return styleCache;
}
