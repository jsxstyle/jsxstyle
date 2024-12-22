import { getStyleCache } from './getStyleCache.js';

export { addStyleToHead } from './addStyleToHead.js';
export {
  componentStyles,
  type JsxstyleComponentName,
} from './componentStyles.js';
export { createClassNameGetter } from './createClassNameGetter.js';
export { dangerousStyleValue } from './dangerousStyleValue.js';
export { getCustomPropertiesFunction } from './makeCustomProperties.js';
export { hyphenateStyleName } from './hyphenateStyleName.js';
export { isObject } from './typePredicates.js';
export { processProps, type GetClassNameForKeyFn } from './processProps.js';
export { stringHash } from './stringHash.js';
export { generateCustomPropertiesFromVariants } from './generateCustomPropertiesFromVariants.js';
export { makeCssFunction } from './makeCssFunction.js';
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
} from './makeCustomProperties.js';
export type {
  VariantMap,
  CustomPropsObject,
  GetCustomProperties,
  NestedCustomPropsObject,
} from './generateCustomPropertiesFromVariants.js';
export type { InsertRuleCallback } from './processProps.js';
export type { RequestStyleCache } from './createRequestStyleCache.js';

export const cacheSingleton = getStyleCache();
