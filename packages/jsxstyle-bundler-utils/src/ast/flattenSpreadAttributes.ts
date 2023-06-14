import * as t from '@babel/types';
import invariant from 'invariant';
import type { PrimitiveValue, NodeValue } from './styleObjectUtils';

/**
 * Given an array of JSX attributes or object properties,
 * expand all spread props and merge the results into a map of value objects:
 *
 *  - `PrimitiveValue` if the value has already been evaluated
 *  - `NodeValue` if the value has not yet been evaluated
 *
 * Values are left unevaluated if possible.
 */
export const flattenSpreadAttributes = (
  attributes: Array<
    | t.JSXAttribute
    | t.JSXSpreadAttribute
    | t.ObjectMethod
    | t.ObjectProperty
    | t.SpreadElement
  >,
  attemptEval: (node: t.Node) => any
) => {
  return attributes.reduce<Map<string, PrimitiveValue | NodeValue>>(
    (prev, attr) => {
      if (attr.type === 'JSXSpreadAttribute' || attr.type === 'SpreadElement') {
        // TODO(meyer) extract all props that are past the last spread item
        const argValue = attemptEval(attr.argument);
        if (argValue == null) return prev;
        invariant(typeof argValue === 'object', 'Unhandled spread item');
        for (const [key, value] of Object.entries(argValue)) {
          // stringify everything else
          prev.set(key, { type: 'primitive', value });
        }
      } else if (attr.type === 'JSXAttribute') {
        invariant(
          attr.name.type === 'JSXIdentifier',
          'Unhandled attribute type: %s',
          attr.name.type
        );

        const key = attr.name.name;
        let value: t.Expression | null | undefined = null;
        if (attr.value?.type === 'JSXExpressionContainer') {
          // edge case
          if (attr.value.expression.type === 'JSXEmptyExpression') {
            value = undefined;
          } else {
            value = attr.value.expression;
          }
        } else {
          value = attr.value;
        }

        if (value == null) {
          prev.set(key, { type: 'primitive', value });
        } else {
          prev.set(key, { type: 'node', value });
        }
      } else if (attr.type === 'ObjectProperty') {
        invariant(
          attr.key.type === 'Identifier' || attr.key.type === 'StringLiteral',
          'Unsupported key type: %s',
          attr.key.type
        );
        invariant(
          attr.value.type !== 'ArrayPattern' &&
            attr.value.type !== 'AssignmentPattern' &&
            attr.value.type !== 'ObjectPattern' &&
            attr.value.type !== 'RestElement',
          'Unsupported value type: %s',
          attr.value.type
        );
        const key =
          attr.key.type === 'Identifier' ? attr.key.name : attr.key.value;
        const value = attr.value;

        prev.set(key, { type: 'node', value });
      } else {
        throw new Error('Unhandled attribute type: ' + attr.type);
      }

      return prev;
    },
    new Map()
  );
};
