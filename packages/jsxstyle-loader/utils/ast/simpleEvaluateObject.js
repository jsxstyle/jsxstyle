'use strict';

const t = require('babel-types');
const simpleEvaluate = require('./simpleEvaluate');
const invariant = require('invariant');

function simpleEvaluateObject(exprNode) {
  invariant(
    t.isObjectExpression(exprNode),
    'simpleEvaluateObject expects an ObjectExpression as its first parameter'
  );

  const ret = {};

  for (let idx = -1, len = exprNode.properties.length; ++idx < len; ) {
    const value = exprNode.properties[idx];

    invariant(!value.computed, 'Computed values are not supported');

    let key = null;
    if (t.isIdentifier(value.key)) {
      key = value.key.name;
    } else if (t.isLiteral(value.key)) {
      // TODO: make sure this doesn't suck
      key = value.key.value;
    } else {
      invariant(false, 'Unsupported key type: %s', value.key.type);
    }

    ret[key] = simpleEvaluate(value.value);
  }

  return ret;
}

module.exports = simpleEvaluateObject;
