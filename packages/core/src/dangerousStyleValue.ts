/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import { unitlessNumbers } from './sharedConstants.js';

// Based on
// https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/CSSPropertyOperations.js#L14
export function dangerousStyleValue(name: string, value: unknown): string {
  const isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  if (typeof value === 'number' && value !== 0) {
    if (value > -1 && value < 1) {
      return Math.round(value * 1e6) / 1e4 + '%';
    }
    if (!unitlessNumbers.has(name)) {
      return value + 'px';
    }
  }

  if (!(value as any).toString) {
    // values that lack a toString method on their prototype will throw a TypeError
    // see https://github.com/jsxstyle/jsxstyle/issues/112
    if (
      // @ts-expect-error
      typeof process !== 'undefined' &&
      // @ts-expect-error
      process.env.NODE_ENV === 'development'
    ) {
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
