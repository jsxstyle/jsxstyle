import {
  getCustomPropertiesFunction,
  makeCssFunction,
  cacheSingleton,
} from '@jsxstyle/core';
import { classNamePropKey, componentFactory } from './componentFactory.js';

export type { CSSProperties } from '@jsxstyle/core';
export type { StylableComponentProps } from './types.js';
export { cacheSingleton as cache };
export { useMatchMedia } from './useMatchMedia.js';

export const makeCustomProperties =
  /*#__PURE__*/ getCustomPropertiesFunction(cacheSingleton);

export const css = /*#__PURE__*/ makeCssFunction(
  classNamePropKey,
  cacheSingleton
);

export const Box = /*#__PURE__*/ componentFactory('Box');
export const Block = /*#__PURE__*/ componentFactory('Block');
export const Inline = /*#__PURE__*/ componentFactory('Inline');
export const InlineBlock = /*#__PURE__*/ componentFactory('InlineBlock');

export const Row = /*#__PURE__*/ componentFactory('Row');
export const Col = /*#__PURE__*/ componentFactory('Col');
export const InlineRow = /*#__PURE__*/ componentFactory('InlineRow');

export const InlineCol = /*#__PURE__*/ componentFactory('InlineCol');

export const Grid = /*#__PURE__*/ componentFactory('Grid');
