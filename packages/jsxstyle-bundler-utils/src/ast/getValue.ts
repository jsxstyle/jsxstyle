import type * as t from '@babel/types';
import { normalizeTernary } from './normalizeTernary';
import type { PrimitiveValue, TernaryValue } from './styleObjectUtils';

export const getValue = (
  node: t.Expression,
  attemptEval: (node: t.Node) => any
): TernaryValue | PrimitiveValue => {
  if (
    node.type === 'ConditionalExpression' ||
    node.type === 'LogicalExpression'
  ) {
    const { test, consequent, alternate } = normalizeTernary(node);
    return {
      type: 'ternary',
      test,
      consequent: getValue(consequent, attemptEval),
      alternate: getValue(alternate, attemptEval),
    };
  }
  const value = attemptEval(node);
  return {
    type: 'primitive',
    value,
  };
};
