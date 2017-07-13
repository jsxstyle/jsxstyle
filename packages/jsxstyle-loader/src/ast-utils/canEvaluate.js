'use strict';

const t = require('babel-types');

function canEvaluate(staticNamespace, exprNode) {
  if (t.isTemplateLiteral(exprNode)) {
    // exprNode is a template literal and all expressions in the template literal can be evaluated
    for (let idx = -1, len = exprNode.expressions.length; ++idx < len; ) {
      const expr = exprNode.expressions[idx];
      if (!canEvaluate(staticNamespace, expr)) {
        return false;
      }
    }
    return true;
  } else if (t.isLiteral(exprNode)) {
    // exprNode is a string, int, or null
    return true;
  } else if (t.isUnaryExpression(exprNode) && exprNode.operator === '-') {
    return canEvaluate(staticNamespace, exprNode.argument);
  } else if (t.isIdentifier(exprNode)) {
    // exprNode is a variable
    if (
      typeof staticNamespace === 'object' &&
      staticNamespace !== null &&
      staticNamespace.hasOwnProperty(exprNode.name)
    ) {
      return true;
    }
    return false;
  } else if (t.isMemberExpression(exprNode)) {
    // exprNode is a member expression (object.property or object['property'])
    return (
      // object is in the provided namespace
      canEvaluate(staticNamespace, exprNode.object) &&
      // property is either an identifier specified with dot notation
      ((t.isIdentifier(exprNode.property) && !exprNode.computed) ||
        // or it's specified with bracket notation and can be evaluated
        canEvaluate(staticNamespace, exprNode.property))
    );
  } else if (t.isBinaryExpression(exprNode)) {
    // exprNode is a binary expression and both sides can be evaluated
    return (
      canEvaluate(staticNamespace, exprNode.left) &&
      canEvaluate(staticNamespace, exprNode.right)
    );
  }
  return false;
}

module.exports = canEvaluate;
