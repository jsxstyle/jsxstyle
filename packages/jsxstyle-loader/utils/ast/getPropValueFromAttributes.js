'use strict';

const invariant = require('invariant');
const t = require('@babel/types');
const generate = require('./generate');

const accessSafe = require('./accessSafe');

// getPropValueFromAttributes gets a prop by name from a list of attributes and accounts for potential spread operators.

// Here's an example. Given this component:
//   <Block coolProp="wow" {...spread1} neatProp="ok" {...spread2} />
// getPropValueFromAttributes will return the following:
// - for propName 'coolProp':   accessSafe(spread1, 'coolProp') || accessSafe(spread2, 'coolProp') || 'wow'
// - for propName 'neatProp':   accessSafe(spread2, 'neatProp') || 'ok'
// - for propName 'notPresent': null

// The returned value should (obviously) be placed after spread operators.

function getPropValueFromAttributes(propName, attrs) {
  const propIndex = attrs.findIndex(
    attr => attr.name && attr.name.name === propName
  );

  if (propIndex === -1) {
    return null;
  }

  let propValue = attrs[propIndex].value;

  if (t.isJSXExpressionContainer(propValue)) {
    propValue = propValue.expression;
  }

  // filter out spread props that occur before propValue
  const applicableSpreads = attrs
    .filter(
      // 1. idx is greater than propValue prop index
      // 2. attr is a spread operator
      (attr, idx) => {
        if (t.isJSXSpreadAttribute(attr)) {
          invariant(
            // only allow member expressions and identifiers to be spread for now
            t.isIdentifier(attr.argument) ||
              t.isMemberExpression(attr.argument),
            'Unhandled spread operator value of type `%s` (`%s`)',
            attr.argument.type,
            generate(attr).code
          );
          return idx > propIndex;
        }
        return false;
      }
    )
    .map(attr => attr.argument);

  // if spread operators occur after propValue, create a binary expression for each operator
  // i.e. before1.propValue || before2.propValue || propValue
  // TODO: figure out how to do this without all the extra parens
  if (applicableSpreads.length > 0) {
    propValue = applicableSpreads.reduce(
      (acc, val) => t.logicalExpression('||', accessSafe(val, propName), acc),
      propValue
    );
  }

  return propValue;
}

module.exports = getPropValueFromAttributes;
