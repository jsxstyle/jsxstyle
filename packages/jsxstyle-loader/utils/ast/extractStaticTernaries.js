'use strict';

const t = require('babel-types');
const vm = require('vm');
const invariant = require('invariant');

const generate = require('./generate');
const getClassNameFromCache = require('../getClassNameFromCache');

function extractStaticTernaries(
  ternaries,
  evalContext,
  cacheObject,
  classNameFormat
) {
  invariant(
    Array.isArray(ternaries),
    'extractStaticTernaries expects param 1 to be an array of ternaries'
  );
  invariant(
    typeof evalContext === 'object' && evalContext !== null,
    'extractStaticTernaries expects param 2 to be an object'
  );
  invariant(
    typeof cacheObject === 'object' && cacheObject !== null,
    'extractStaticTernaries expects param 3 to be an object'
  );

  if (ternaries.length === 0) {
    return null;
  }

  const ternariesByKey = {};
  for (let idx = -1, len = ternaries.length; ++idx < len; ) {
    const { name, ternary } = ternaries[idx];
    let { test, consequent, alternate } = ternary;

    // strip parens
    if (t.isExpressionStatement(test)) {
      test = test.expression;
    }

    // convert `!thing` to `thing` with swapped consequent and alternate
    let shouldSwap = false;
    if (t.isUnaryExpression(test) && test.operator === '!') {
      test = test.argument;
      shouldSwap = true;
    } else if (t.isBinaryExpression(test)) {
      if (test.operator === '!==') {
        test = t.binaryExpression('===', test.left, test.right);
        shouldSwap = true;
      } else if (test.operator === '!=') {
        test = t.binaryExpression('==', test.left, test.right);
        shouldSwap = true;
      }
    }

    if (shouldSwap) {
      consequent = ternary.alternate;
      alternate = ternary.consequent;
    }

    const consequentValue = vm.runInContext(
      generate(consequent).code,
      evalContext
    );
    const alternateValue = vm.runInContext(
      generate(alternate).code,
      evalContext
    );

    const key = generate(test).code;
    ternariesByKey[key] = ternariesByKey[key] || {
      test,
      consequentStyles: {},
      alternateStyles: {},
    };
    ternariesByKey[key].consequentStyles[name] = consequentValue;
    ternariesByKey[key].alternateStyles[name] = alternateValue;
  }

  const stylesByClassName = {};

  const ternaryExpression = Object.keys(ternariesByKey)
    .map((key, idx) => {
      const { test, consequentStyles, alternateStyles } = ternariesByKey[key];
      const consequentClassName =
        getClassNameFromCache(consequentStyles, cacheObject, classNameFormat) ||
        '';
      const alternateClassName =
        getClassNameFromCache(alternateStyles, cacheObject, classNameFormat) ||
        '';

      if (!consequentClassName && !alternateClassName) {
        return null;
      }

      if (consequentClassName) {
        stylesByClassName[consequentClassName] = consequentStyles;
      }

      if (alternateClassName) {
        stylesByClassName[alternateClassName] = alternateStyles;
      }

      if (consequentClassName && alternateClassName) {
        if (idx > 0) {
          // if it's not the first ternary, add a leading space
          return t.binaryExpression(
            '+',
            t.stringLiteral(' '),
            t.conditionalExpression(
              test,
              t.stringLiteral(consequentClassName),
              t.stringLiteral(alternateClassName)
            )
          );
        } else {
          return t.conditionalExpression(
            test,
            t.stringLiteral(consequentClassName),
            t.stringLiteral(alternateClassName)
          );
        }
      } else {
        // if only one className is present, put the padding space inside the ternary
        return t.conditionalExpression(
          test,
          t.stringLiteral(
            (idx > 0 && consequentClassName ? ' ' : '') + consequentClassName
          ),
          t.stringLiteral(
            (idx > 0 && alternateClassName ? ' ' : '') + alternateClassName
          )
        );
      }
    })
    .filter(f => f)
    .reduce(
      (acc, val) => (acc ? t.binaryExpression('+', acc, val) : val),
      null
    );

  if (!ternaryExpression) {
    return null;
  }

  return {
    // styles to be extracted
    stylesByClassName,
    // ternaries grouped into one binary expression
    ternaryExpression,
  };
}

module.exports = extractStaticTernaries;
