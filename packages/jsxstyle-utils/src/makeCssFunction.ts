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

export type CssFunction = ReturnType<typeof makeCssFunction>;

export const makeCssFunction =
  (
    classNamePropKey: string,
    getComponentProps: StyleCache['getComponentProps']
  ) =>
  (params: CSSParams) => {
    const result = getComponentProps(params, classNamePropKey);
    const classNameString = result?.[classNamePropKey];
    return typeof classNameString === 'string' ? classNameString : undefined;
  };
