'use strict';

const recast = require('recast');

const types = recast.types;
const n = types.namedTypes;

function canEvaluate(staticNamespace, exprNode) {
  if (n.Literal.check(exprNode)) {
    // exprNode is a string, int, or null
    return true;
  } else if (n.JSXExpressionContainer.check(exprNode)) {
    // exprNode is wrapped in an expression container
    return canEvaluate(staticNamespace, exprNode.expression);
  } else if (n.Identifier.check(exprNode)) {
    // exprNode is a variable
    if (
      typeof staticNamespace === 'object' &&
      staticNamespace !== null &&
      staticNamespace.hasOwnProperty(exprNode.name)
    ) {
      return true;
    }
    return false;
  } else if (n.MemberExpression.check(exprNode)) {
    // exprNode is a member expression (object.property or object['property'])
    return (
      // object is in the provided namespace
      canEvaluate(staticNamespace, exprNode.object) &&
      // property is either an identifier specified with dot notation
      ((n.Identifier.check(exprNode.property) && !exprNode.computed) ||
        // or it's specified with bracket notation and can be evaluated
        canEvaluate(staticNamespace, exprNode.property))
    );
  } else if (n.BinaryExpression.check(exprNode)) {
    // exprNode is a binary expression and both sides can be evaluated
    return canEvaluate(staticNamespace, exprNode.left) && canEvaluate(staticNamespace, exprNode.right);
  } else if (n.TemplateLiteral.check(exprNode)) {
    // exprNode is a template literal and all expressions in the template literal can be evaluated
    for (let idx = -1, len = exprNode.expressions.length; ++idx < len; ) {
      const expr = exprNode.expressions[idx];
      if (!canEvaluate(staticNamespace, expr)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

module.exports = canEvaluate;
