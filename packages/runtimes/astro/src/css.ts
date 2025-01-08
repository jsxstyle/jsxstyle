import type { JsxstyleComponentStyleProps } from '@jsxstyle/core';
import type { AstroGlobal } from 'astro';

export const getCss = (Astro: AstroGlobal) => {
  let styles = '';
  let hasUnwound = false;

  const cache = Astro.locals.jsxstyleCache;

  if (!cache) {
    throw new Error(
      'jsxstyle cache not found, please install the jsxstyle Astro integration'
    );
  }

  return {
    /** Returns classnames for all styles passed in */
    css: (
      ...params: Array<
        JsxstyleComponentStyleProps | string | null | undefined | false
      >
    ): string | undefined => {
      if (hasUnwound) {
        throw new Error(
          '`unwind` has already been called. New styles cannot be generated.'
        );
      }

      let className = '';
      const styleObj: JsxstyleComponentStyleProps = {};
      for (const param of params) {
        if (!param) continue;
        let classNameString: unknown;

        if (typeof param === 'string') {
          classNameString = param;
        } else {
          // TODO(meyer) handle nestable object-type params (like media queries)
          Object.assign(styleObj, param);
        }

        if (classNameString && typeof classNameString === 'string') {
          className = (className ? className + ' ' : '') + classNameString;
        }
      }
      const result = cache.getComponentProps(styleObj);

      styles += result.styles;

      return className && result.className
        ? `${className} ${result.className}`
        : className || result.className || undefined;
    },

    /** Returns all styles generated by `css` */
    unwind: (): string => {
      if (hasUnwound) {
        throw new Error('`unwind` should only be called once');
      }
      hasUnwound = true;
      return styles;
    },
  };
};
