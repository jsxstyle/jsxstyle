'use strict';

const t = require('@babel/types');
const invariant = require('invariant');

function evaluateAstNode(exprNode, evalFn) {
  const hasFn = evalFn && typeof evalFn === 'function';

  // loop through ObjectExpression keys
  if (t.isObjectExpression(exprNode)) {
    const ret = {};
    for (let idx = -1, len = exprNode.properties.length; ++idx < len; ) {
      const value = exprNode.properties[idx];

      let key = null;
      if (value.computed) {
        invariant(
          hasFn,
          'evaluateAstNode does not support computed keys unless an eval function is provided'
        );
        key = evaluateAstNode(value.key, evalFn);
      } else if (t.isIdentifier(value.key)) {
        key = value.key.name;
      } else if (t.isLiteral(value.key)) {
        key = value.key.value;
      } else {
        invariant(false, 'Unsupported key type: %s', value.key.type);
      }

      ret[key] = evaluateAstNode(value.value);
    }
    return ret;
  }

  if (t.isUnaryExpression(exprNode) && exprNode.operator === '-') {
    return -evaluateAstNode(exprNode.argument, evalFn);
  }

  if (t.isTemplateLiteral(exprNode)) {
    invariant(
      hasFn,
      'evaluateAstNode does not support template literals unless an eval function is provided'
    );

    let ret = '';
    for (let idx = -1, len = exprNode.quasis.length; ++idx < len; ) {
      const quasi = exprNode.quasis[idx];
      const expr = exprNode.expressions[idx];
      ret += quasi.value.raw;
      if (expr) {
        ret += evaluateAstNode(expr, evalFn);
      }
    }
    return ret;
  }

  if (t.isLiteral(exprNode)) {
    // In the interest of representing the "evaluated" prop
    // as the user intended, we support negative null. Why not.
    return t.isNullLiteral(exprNode) ? null : exprNode.value;
  }

  if (t.isBinaryExpression(exprNode)) {
    if (exprNode.operator === '+') {
      return (
        evaluateAstNode(exprNode.left, evalFn) +
        evaluateAstNode(exprNode.right, evalFn)
      );
    } else if (exprNode.operator === '-') {
      return (
        evaluateAstNode(exprNode.left, evalFn) -
        evaluateAstNode(exprNode.right, evalFn)
      );
    } else if (exprNode.operator === '*') {
      return (
        evaluateAstNode(exprNode.left, evalFn) *
        evaluateAstNode(exprNode.right, evalFn)
      );
    } else if (exprNode.operator === '/') {
      return (
        evaluateAstNode(exprNode.left, evalFn) /
        evaluateAstNode(exprNode.right, evalFn)
      );
    }
  }

  // TODO: member expression?

  // if we've made it this far, the value has to be evaluated
  invariant(
    hasFn,
    'evaluateAstNode does not support non-literal values unless an eval function is provided'
  );

  return evalFn(exprNode);
}

module.exports = evaluateAstNode;
