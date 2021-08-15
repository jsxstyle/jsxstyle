/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

//  A hearty blend of the following two files:
// https://github.com/facebook/react/blob/master/packages/react-dom/src/shared/CSSProperty.js
// https://github.com/facebook/react/blob/master/packages/react-dom/src/shared/dangerousStyleValue.js

const isUnitlessNumber: Record<string, true> = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexNegative: true,
  flexOrder: true,
  flexPositive: true,
  flexShrink: true,
  fontWeight: true,
  gridArea: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
};

function prefixKey(prefix: string, key: string): string {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

const prefixes = ['Webkit', 'ms', 'Moz', 'O'];

Object.keys(isUnitlessNumber).forEach((prop) => {
  prefixes.forEach((prefix) => {
    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
  });
});

export function dangerousStyleValue(name: any, value: any): string {
  const isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  if (
    typeof value === 'number' &&
    value !== 0 &&
    !(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])
  ) {
    if (value > -1 && value < 1) {
      return Math.round(value * 1e6) / 1e4 + '%';
    }
    return value + 'px';
  }

  if (!value.toString) {
    // values that lack a toString method on their prototype will throw a TypeError
    // see https://github.com/jsxstyle/jsxstyle/issues/112
    if (process.env.NODE_ENV === 'development') {
      console.error(
        'Value for prop `%s` (`%o`) cannot be stringified.',
        name,
        value
      );
    }
    return '';
  }

  return ('' + value).trim();
}
