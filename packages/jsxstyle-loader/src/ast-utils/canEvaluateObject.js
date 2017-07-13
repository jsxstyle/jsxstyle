'use strict';

const t = require('babel-types');
const canEvaluate = require('./canEvaluate');

function canEvaluateObject(staticNamespace, exprNode) {
  if (!t.isObjectExpression(exprNode)) {
    return false;
  }

  for (let idx = -1, len = exprNode.properties.length; ++idx < len; ) {
    const value = exprNode.properties[idx];

    if (value.computed) {
      if (!canEvaluate(staticNamespace, value.key)) {
        return false;
      }
      continue;
    }

    // TODO: allow other types of key types (literal?)
    if (!t.isIdentifier(value.key)) {
      return false;
    }

    if (!canEvaluate(staticNamespace, value.value)) {
      return false;
    }
  }

  return true;
}

module.exports = canEvaluateObject;
