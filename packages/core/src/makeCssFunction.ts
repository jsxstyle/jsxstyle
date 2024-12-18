import type { StyleCache } from './getStyleCache.js';
import type { JsxstyleComponentStyleProps } from './types.js';

export const makeCssFunction =
  (classNamePropKey: string, cache: Pick<StyleCache, 'getComponentProps'>) =>
  (
    ...params: Array<
      JsxstyleComponentStyleProps | string | null | undefined | false
    >
  ): string => {
    let className = '';
    for (const param of params) {
      if (!param) continue;
      let classNameString: unknown;

      if (typeof param === 'string') {
        classNameString = param;
      } else {
        const result = cache.getComponentProps(param, classNamePropKey);
        classNameString = result?.[classNamePropKey];
      }

      if (classNameString && typeof classNameString === 'string') {
        className = (className ? className + ' ' : '') + classNameString;
      }
    }
    return className;
  };
