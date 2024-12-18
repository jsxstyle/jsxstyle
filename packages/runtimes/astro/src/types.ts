import type { CSSParams, CommonComponentProp } from '@jsxstyle/core';

export type AstroJsxstyleComponentProps<
  K extends keyof astroHTML.JSX.DefinedIntrinsicElements = 'div',
> = CSSParams &
  Pick<
    astroHTML.JSX.DefinedIntrinsicElements[K],
    Extract<
      CommonComponentProp,
      keyof astroHTML.JSX.DefinedIntrinsicElements[K]
    >
  > & {
    component?: K;
    props?: astroHTML.JSX.DefinedIntrinsicElements[K];
  };
