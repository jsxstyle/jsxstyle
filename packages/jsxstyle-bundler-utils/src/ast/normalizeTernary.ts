import * as t from '@babel/types';

export const normalizeTernary = (
  node: t.ConditionalExpression | t.LogicalExpression
) => {
  let test: t.Expression;
  let consequent: t.Expression;
  let alternate: t.Expression;
  if (node.type === 'ConditionalExpression') {
    test = node.test;
    consequent = node.consequent;
    alternate = node.alternate;
  } else if (node.type === 'LogicalExpression') {
    if (node.operator === '&&') {
      test = node.left;
      consequent = node.right;
      alternate = t.nullLiteral();
    } else {
      // cannot be extracted
      throw new Error(
        'Cannot extract logical expression with operator ' + node.operator
      );
    }
  } else {
    throw new Error('Unhandled node type: ' + (node as any).type);
  }

  // unwrap boolean-coerced expressions
  if (
    test.type === 'UnaryExpression' &&
    test.operator === '!' &&
    test.prefix &&
    test.argument.type === 'UnaryExpression' &&
    test.argument.operator === '!' &&
    test.argument.prefix
  ) {
    test = test.argument.argument;
  }

  if (
    // unwrap negated expressions
    (test.type === 'UnaryExpression' && test.operator === '!' && test.prefix) ||
    (test.type === 'BinaryExpression' &&
      (test.operator === '!=' || test.operator === '!=='))
  ) {
    if (test.type === 'UnaryExpression') {
      test = test.argument;
    } else {
      test = { ...test, operator: test.operator === '!=' ? '==' : '===' };
    }
    const oldAlternate = alternate;
    const oldConsequent = consequent;
    alternate = oldConsequent;
    consequent = oldAlternate;
  }

  return {
    test,
    consequent,
    alternate,
  };
};
