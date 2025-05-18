import { componentFactory } from './componentFactory.js';

export type {
  CSSProperties,
  JsxstyleComponentStyleProps,
} from '@jsxstyle/core';
export {
  cacheSingleton as cache,
  css,
  makeCustomProperties,
} from '@jsxstyle/core';
export type { StylableComponentProps } from './types.js';
export { useMatchMedia } from './useMatchMedia.js';
export { makeComponent } from './makeComponent.js';

export const Box = /*#__PURE__*/ componentFactory('Box');
export const Block = /*#__PURE__*/ componentFactory('Block');
export const Inline = /*#__PURE__*/ componentFactory('Inline');
export const InlineBlock = /*#__PURE__*/ componentFactory('InlineBlock');

export const Row = /*#__PURE__*/ componentFactory('Row');
export const Col = /*#__PURE__*/ componentFactory('Col');
export const InlineRow = /*#__PURE__*/ componentFactory('InlineRow');
export const InlineCol = /*#__PURE__*/ componentFactory('InlineCol');

export const Grid = /*#__PURE__*/ componentFactory('Grid');
