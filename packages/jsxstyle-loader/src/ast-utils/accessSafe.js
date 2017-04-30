'use strict';

const recast = require('recast');

const types = recast.types;
const b = types.builders;

// accessSafe wraps memberExpressions in object/null checks
// TODO: inject this as a function? this gets pretty repetitive
function accessSafe(obj, member) {
  return b.logicalExpression(
    '&&',
    b.logicalExpression(
      '&&',
      // typeof obj === 'object
      b.binaryExpression('===', b.unaryExpression('typeof', obj), b.literal('object')),
      // obj !== null
      b.binaryExpression('!==', obj, b.literal(null))
    ),
    // obj.member
    b.memberExpression(obj, b.identifier(member), false)
  );
}

module.exports = accessSafe;
