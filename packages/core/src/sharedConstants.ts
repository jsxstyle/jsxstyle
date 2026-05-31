/**
 * Single source of truth for constants shared between TypeScript and Rust.
 *
 * A codegen script reads these exports and generates `generated_constants.rs`
 * for the Rust SWC plugin. The generated `.rs` file is checked into git so
 * Rust builds never require Node.
 *
 * Exports are in the format TS runtime consumers need (Sets, Records).
 * The codegen script handles converting to Rust types.
 */

export { componentStyles } from './componentStyles.js';

/**
 * CSS properties which accept numbers but are not in units of "px".
 *
 * Copied from
 * https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/shared/isUnitlessNumber.js
 */
export const unitlessNumbers = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'gridArea',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'fontWeight',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity', // SVG-related properties
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
  'MozAnimationIterationCount', // Known Prefixed Properties
  'MozBoxFlex', // TODO: Remove these since they shouldn't be used in modern code
  'MozBoxFlexGroup',
  'MozLineClamp',
  'msAnimationIterationCount',
  'msFlex',
  'msZoom',
  'msFlexGrow',
  'msFlexNegative',
  'msFlexOrder',
  'msFlexPositive',
  'msFlexShrink',
  'msGridColumn',
  'msGridColumnSpan',
  'msGridRow',
  'msGridRowSpan',
  'WebkitAnimationIterationCount',
  'WebkitBoxFlex',
  'WebKitBoxFlexGroup',
  'WebkitBoxOrdinalGroup',
  'WebkitColumnCount',
  'WebkitColumns',
  'WebkitFlex',
  'WebkitFlexGrow',
  'WebkitFlexPositive',
  'WebkitFlexShrink',
  'WebkitLineClamp',
]);

/** Pseudoelements recognized by jsxstyle as prop name prefixes. */
export const pseudoElements = new Set([
  'after',
  'before',
  'placeholder',
  'selection',
]);

/** Pseudoclasses recognized by jsxstyle as prop name prefixes. */
export const pseudoClasses = new Set([
  'active',
  'checked',
  'disabled',
  'empty',
  'enabled',
  'focus',
  'hover',
  'invalid',
  'link',
  'required',
  'target',
  'valid',
]);

/** CSS property prefixes that trigger double specificity (+1). */
export const doubleSpecificityPrefixes: Record<string, true> = {
  animation: true,
  background: true,
  flex: true,
  font: true,
  margin: true,
  padding: true,
};

/** Shorthand prop expansions (data-only, no type info). */
export const shorthandExpansions = [
  { shorthand: 'marginH', expanded: ['marginLeft', 'marginRight'] },
  { shorthand: 'marginV', expanded: ['marginTop', 'marginBottom'] },
  { shorthand: 'paddingH', expanded: ['paddingLeft', 'paddingRight'] },
  { shorthand: 'paddingV', expanded: ['paddingTop', 'paddingBottom'] },
] as const;

/** Props consumed by the extractor/runtime, not passed through to the output element. */
export const skippedProps = new Set(['component', 'mediaQueries', 'props']);

/**
 * HTML attributes that pass through to the DOM element untouched at runtime
 * (don't need a `props` wrapper).
 */
export const commonComponentProps: Record<string, true> = {
  alt: true,
  checked: true,
  children: true,
  class: true,
  className: true,
  disabled: true,
  href: true,
  id: true,
  name: true,
  placeholder: true,
  slot: true,
  src: true,
  style: true,
  title: true,
  type: true,
  value: true,
};

/** Valid jsxstyle source packages. */
export const jsxstyleSources = [
  '@jsxstyle/react',
  '@jsxstyle/preact',
  '@jsxstyle/solid',
] as const;

/** Known non-component imports from jsxstyle packages. */
export const nonComponentImports = [
  'useMatchMedia',
  'makeCustomProperties',
  'css',
] as const;
