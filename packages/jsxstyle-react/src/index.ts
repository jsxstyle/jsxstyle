import { styleCache } from './styleCache';
import { classNamePropKey, componentFactory } from './componentFactory';
import { makeCssFunction } from '../../jsxstyle-utils/src/makeCssFunction';

export type { CSSProperties } from '../../jsxstyle-utils/src';
export type { StylableComponentProps } from './types';
export { styleCache as cache };
export { useMatchMedia } from './useMatchMedia';
export { makeCustomProperties } from '../../jsxstyle-utils/src';

export const css: ReturnType<typeof makeCssFunction> = makeCssFunction(
  classNamePropKey,
  styleCache.getComponentProps
);

// Using ReturnType + explicit typing to prevent Hella Dupes in the generated types
type JsxstyleComponent = ReturnType<typeof componentFactory>;

export const Box: JsxstyleComponent = componentFactory('Box');
export const Block: JsxstyleComponent = componentFactory('Block');
export const Inline: JsxstyleComponent = componentFactory('Inline');
export const InlineBlock: JsxstyleComponent = componentFactory('InlineBlock');

export const Row: JsxstyleComponent = componentFactory('Row');
export const Col: JsxstyleComponent = componentFactory('Col');
export const InlineRow: JsxstyleComponent = componentFactory('InlineRow');
export const InlineCol: JsxstyleComponent = componentFactory('InlineCol');

export const Grid: JsxstyleComponent = componentFactory('Grid');
