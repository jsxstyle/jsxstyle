import type { GetClassNameForKeyFn } from './processProps.js';
import { processProps } from './processProps.js';
import type { CacheObject } from './types.js';

export type RequestStyleCache = ReturnType<typeof createRequestStyleCache>;

/**
 * This function creates a style cache that is designed to live for a single request.
 * It should be used in a non-SPA server environment.
 */
export function createRequestStyleCache() {
  let index = 0;
  const getClassName = () => {
    return `_r${(index++).toString(36)}`;
  };
  const classNameCache: CacheObject = {};
  const rules = new Set<string>();

  const memoizedGetClassNameForKey: GetClassNameForKeyFn = (key) => {
    // biome-ignore lint/suspicious/noAssignInExpressions: chill
    return (classNameCache[key] ||= getClassName());
  };

  const styleCache = {
    /**
     * Given an object of component props, this function splits style props and
     * component props, turns style props into CSS, and calls `onInsertRule`
     * for each generated CSS rule.
     *
     * It returns an object of updated component props and a string of styles
     * that should be inserted into the document. Only new styles are returned
     */
    getComponentProps(
      props: Record<string, any>,
      classNamePropKey: string
    ): {
      props: Record<string, unknown> | null;
      styles: string;
    } {
      let styles = '';
      const componentProps = processProps(
        props,
        classNamePropKey,
        memoizedGetClassNameForKey,
        (rule) => {
          if (!rules.has(rule)) {
            rules.add(rule);
            styles += rule;
          }
        }
      );
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
