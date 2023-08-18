import type { StyleCache } from './getStyleCache';
import type { CSSProperties } from './types';

type AmpersandStyles = {
  [key: `${string}&${string}`]: CSSProperties;
};

type CSSParams = CSSProperties &
  AmpersandStyles & {
    [key: `@container ${string}`]: CSSProperties & AmpersandStyles;
    [key: `@media ${string}`]: CSSProperties & AmpersandStyles;
  };

export const makeCssFunction =
  (classNamePropKey: string, cache: Pick<StyleCache, 'getComponentProps'>) =>
  (...params: Array<CSSParams | string | null | undefined | false>): string => {
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

      if (typeof classNameString === 'string') {
        className = (className ? className + ' ' : '') + classNameString;
      }
    }
    return className;
  };
