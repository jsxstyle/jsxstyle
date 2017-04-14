'use strict';

const recast = require('recast');

const types = recast.types;
const n = types.namedTypes;

function canEvaluate(staticNamespace, exprNode) {
  if (n.Literal.check(exprNode)) {
    return true;
  } else if (n.JSXExpressionContainer.check(exprNode)) {
    return canEvaluate(staticNamespace, exprNode.expression);
  } else if (n.Identifier.check(exprNode) && staticNamespace.hasOwnProperty(exprNode.name)) {
    return true;
  } else if (n.MemberExpression.check(exprNode)) {
    return n.Identifier.check(exprNode.property) && canEvaluate(staticNamespace, exprNode.object);
  } else if (n.BinaryExpression.check(exprNode)) {
    return canEvaluate(staticNamespace, exprNode.left) && canEvaluate(staticNamespace, exprNode.right);
  } else if (n.TemplateLiteral.check(exprNode)) {
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
