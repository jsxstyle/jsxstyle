import { getStyleCache } from './getStyleCache.js';
import { makeCssFunction } from './makeCssFunction.js';
import { getCustomPropertiesFunction } from './makeCustomProperties.js';

export { addStyleToHead } from './addStyleToHead.js';
export {
  componentStyles,
  type JsxstyleComponentName,
} from './componentStyles.js';
export { createClassNameGetter } from './createClassNameGetter.js';
export { dangerousStyleValue } from './dangerousStyleValue.js';
export { hyphenateStyleName } from './hyphenateStyleName.js';
export { isObject } from './typePredicates.js';
export { processProps, type GetClassNameForKeyFn } from './processProps.js';
export { stringHash } from './stringHash.js';
export { generateCustomPropertiesFromVariants } from './generateCustomPropertiesFromVariants.js';
export { createRequestStyleCache } from './createRequestStyleCache.js';

export { getStyleCache };
export type { StyleCache } from './getStyleCache.js';
export type { CacheObject, EventHandlerKeys } from './types.js';
export type { CommonComponentProp } from './parseStyleProps.js';
export type { CSSProperties, JsxstyleComponentStyleProps } from './types.js';
export type {
  MakeCustomPropertiesFunction,
  CustomPropertyVariantWithSetMethod,
  BuiltCustomProperties,
  VariantOptions,
} from './makeCustomProperties.js';
export type {
  VariantMap,
  CustomPropsObject,
  GetCustomProperties,
} from './generateCustomPropertiesFromVariants.js';
export type { InsertRuleCallback } from './processProps.js';
export type { RequestStyleCache } from './createRequestStyleCache.js';

export const cacheSingleton = /*#__PURE__*/ getStyleCache();
export const makeCustomProperties =
  /*#__PURE__*/ getCustomPropertiesFunction(cacheSingleton);

export const css = /*#__PURE__*/ makeCssFunction(cacheSingleton);
