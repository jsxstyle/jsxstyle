'use strict';

const t = require('babel-types');

function canEvaluate(staticNamespace, exprNode) {
  // exprNode is a template literal and all expressions in the template literal can be evaluated
  if (t.isTemplateLiteral(exprNode)) {
    for (let idx = -1, len = exprNode.expressions.length; ++idx < len; ) {
      const expr = exprNode.expressions[idx];
      if (!canEvaluate(staticNamespace, expr)) {
        return false;
      }
    }
    return true;
  }

  // exprNode is a string, int, or null
  if (t.isLiteral(exprNode)) {
    return true;
  }

  // exprNode is minus whatever
  if (t.isUnaryExpression(exprNode) && exprNode.operator === '-') {
    return canEvaluate(staticNamespace, exprNode.argument);
  }

  // exprNode is a variable
  if (t.isIdentifier(exprNode)) {
    return (
      typeof staticNamespace === 'object' &&
      staticNamespace !== null &&
      staticNamespace.hasOwnProperty(exprNode.name)
    );
  }

  // exprNode is a member expression (object.property or object['property'])
  if (t.isMemberExpression(exprNode)) {
    return (
      // object is in the provided namespace
      canEvaluate(staticNamespace, exprNode.object) &&
      // property is either an identifier specified with dot notation...
      ((t.isIdentifier(exprNode.property) && !exprNode.computed) ||
        // ...or it's specified with bracket notation and can be evaluated
        canEvaluate(staticNamespace, exprNode.property))
    );
  }

  // exprNode is a binary expression and both sides can be evaluated
  if (t.isBinaryExpression(exprNode)) {
    return (
      canEvaluate(staticNamespace, exprNode.left) &&
      canEvaluate(staticNamespace, exprNode.right)
    );
  }
  return false;
}

module.exports = canEvaluate;
