'use strict';

const invariant = require('invariant');
const t = require('babel-types');

function simpleEvaluate(exprNode) {
  let isNegative = false;

  if (t.isUnaryExpression(exprNode)) {
    invariant(
      exprNode.operator === '-',
      'simpleEvaluate only supports unary expressions with a minus operator'
    );
    isNegative = true;
    exprNode = exprNode.argument;
  }

  invariant(
    t.isLiteral(exprNode) && !t.isTemplateLiteral(exprNode),
    'simpleEvaluate only supports literals (template literals excluded)'
  );

  // In the interest of representing the "evaluated" prop
  // as the user intended, we support negative null. Why not.
  const value = t.isNullLiteral(exprNode) ? null : exprNode.value;

  if (isNegative) {
    return -value;
  } else {
    return value;
  }
}

module.exports = simpleEvaluate;
