import { styleCache } from './styleCache';
import { componentFactory } from './componentFactory';

export type { CSSProperties } from 'jsxstyle/utils/src';
export type { StylableComponentProps } from './types';
export { styleCache as cache };
export { makeCustomProperties as EXPERIMENTAL_makeCustomProperties } from 'jsxstyle/utils/src/makeCustomProperties';

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
