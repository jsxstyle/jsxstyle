import generate from '@babel/generator';
import * as t from '@babel/types';
import invariant from 'invariant';

import { accessSafe } from './accessSafe';

/**
 * `getPropValueFromAttributes` gets a prop by name from a list of attributes and accounts for potential spread operators.
 * Here's an example. Given this component:
```ts
  <Block coolProp="wow" {...spread1} neatProp="ok" {...spread2} />
```
 * `getPropValueFromAttributes` will return the following:
 * - for propName `coolProp`:
```ts
  accessSafe(spread1, 'coolProp') || accessSafe(spread2, 'coolProp') || 'wow'
```
 * - for propName `neatProp`:
```ts
  accessSafe(spread2, 'neatProp') || 'ok'
```
 * - for propName `notPresent`: `null`
 *
 * The returned value should (obviously) be placed after spread operators.
 */
export function getPropValueFromAttributes(
  propName: string,
  attrs: Array<t.JSXAttribute | t.JSXSpreadAttribute>
): t.Expression | null {
  let propIndex = -1;
  let jsxAttr: t.JSXAttribute | null = null;
  for (let idx = -1, len = attrs.length; ++idx < len; ) {
    const attr = attrs[idx];
    if (t.isJSXAttribute(attr) && attr.name && attr.name.name === propName) {
      propIndex = idx;
      jsxAttr = attr;
      break;
    }
  }

  if (!jsxAttr || jsxAttr.value == null) {
    return null;
  }

  let propValue:
    | t.JSXElement
    | t.JSXFragment
    | t.StringLiteral
    | t.JSXExpressionContainer
    | t.JSXEmptyExpression
    | t.Expression = jsxAttr.value;

  if (t.isJSXExpressionContainer(propValue)) {
    propValue = propValue.expression;
  }

  // TODO how to handle this??
  if (t.isJSXEmptyExpression(propValue)) {
    console.error('encountered JSXEmptyExpression');
    return null;
  }

  // filter out spread props that occur before propValue
  const applicableSpreads = attrs
    .filter(
      // 1. idx is greater than propValue prop index
      // 2. attr is a spread operator
      (attr, idx): attr is t.JSXSpreadAttribute => {
        if (t.isJSXSpreadAttribute(attr)) {
          invariant(
            // only allow member expressions and identifiers to be spread for now
            t.isIdentifier(attr.argument) ||
              t.isMemberExpression(attr.argument),
            'Unhandled spread operator value of type `%s` (`%s`)',
            attr.argument.type,
            generate(attr).code
          );
          return idx > propIndex;
        }
        return false;
      }
    )
    .map((attr) => attr.argument);

  // if spread operators occur after propValue, create a binary expression for each operator
  // i.e. before1.propValue || before2.propValue || propValue
  // TODO: figure out how to do this without all the extra parens
  if (applicableSpreads.length > 0) {
    propValue = applicableSpreads.reduce<t.Expression>(
      (acc, val) => t.logicalExpression('||', accessSafe(val, propName), acc),
      propValue
    );
  }

  return propValue;
}
