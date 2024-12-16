import { getCustomPropertiesFunction } from '@jsxstyle/core';
import { makeCssFunction } from '@jsxstyle/core';
import { classNamePropKey, componentFactory } from './componentFactory.js';
import { styleCache } from './styleCache.js';

export type { CSSProperties } from '@jsxstyle/core';
export type { StylableComponentProps } from './types.js';
export { styleCache as cache };

export const makeCustomProperties: ReturnType<
  typeof getCustomPropertiesFunction
> = getCustomPropertiesFunction(styleCache);

export const css: ReturnType<typeof makeCssFunction> = makeCssFunction(
  classNamePropKey,
  styleCache
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
