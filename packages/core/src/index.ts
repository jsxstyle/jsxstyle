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

export { getStyleCache };
export type { CacheObject } from './types.js';
export type { CommonComponentProp } from './parseStyleProps.js';
export type { CSSParams } from './makeCssFunction.js';
export type { CSSProperties, AnimatableCSSProperties } from './types.js';
export type { CustomPropertyVariantWithSetMethod } from './makeCustomProperties.js';
export type { VariantMap } from './generateCustomPropertiesFromVariants.js';
export type { InsertRuleCallback } from './processProps.js';
export type { MakeCustomPropertiesFunction } from './makeCustomProperties.js';

export const cacheSingleton = getStyleCache();
