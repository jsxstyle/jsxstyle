import generate from '@babel/generator';
import * as t from '@babel/types';
import invariant from 'invariant';
import { processProps } from '../../../jsxstyle-utils/src';
import type { GetClassNameForKeyFn } from '../../../jsxstyle-utils/src';

export interface Ternary {
  name: string;
  test: t.Expression | t.ExpressionStatement;
  consequent: string | null;
  alternate: string | null;
}

export function extractStaticTernaries(
  ternaries: Ternary[],
  getClassNameForKey: GetClassNameForKeyFn,
  onInsertRule: (rule: string, key: string) => void
): /** ternaries grouped into one binary expression */
t.BinaryExpression | t.ConditionalExpression | null {
  invariant(
    Array.isArray(ternaries),
    'extractStaticTernaries expects param 1 to be an array of ternaries'
  );

  if (ternaries.length === 0) {
    return null;
  }

  const ternariesByKey: Record<
    string,
    {
      test: t.Expression;
      consequentStyles: Record<string, unknown>;
      alternateStyles: Record<string, unknown>;
    }
  > = {};

  for (let idx = -1, len = ternaries.length; ++idx < len; ) {
    const { name, test, consequent, alternate } = ternaries[idx];

    let ternaryTest = test;

    // strip parens
    if (t.isExpressionStatement(test)) {
      ternaryTest = test.expression;
    }

    // convert `!thing` to `thing` with swapped consequent and alternate
    let shouldSwap = false;
    if (t.isUnaryExpression(test) && test.operator === '!') {
      ternaryTest = test.argument;
      shouldSwap = true;
    } else if (t.isBinaryExpression(test)) {
      if (test.operator === '!==') {
        ternaryTest = t.binaryExpression('===', test.left, test.right);
        shouldSwap = true;
      } else if (test.operator === '!=') {
        ternaryTest = t.binaryExpression('==', test.left, test.right);
        shouldSwap = true;
      }
    }

    const key = generate(ternaryTest).code;
    ternariesByKey[key] = ternariesByKey[key] || {
      alternateStyles: {},
      consequentStyles: {},
      test: ternaryTest,
    };
    ternariesByKey[key].consequentStyles[name] = shouldSwap
      ? alternate
      : consequent;
    ternariesByKey[key].alternateStyles[name] = shouldSwap
      ? consequent
      : alternate;
  }

  const ternaryExpression = Object.keys(ternariesByKey)
    .map((key, idx) => {
      const { test, consequentStyles, alternateStyles } = ternariesByKey[key];

      const consequentProps = processProps(
        consequentStyles,
        'className',
        getClassNameForKey,
        onInsertRule
      );

      const alternateProps = processProps(
        alternateStyles,
        'className',
        getClassNameForKey,
        onInsertRule
      );

      const alternateClassName: string =
        (typeof alternateProps?.className === 'string' &&
          alternateProps.className) ||
        '';
      const consequentClassName: string =
        (typeof consequentProps?.className === 'string' &&
          consequentProps.className) ||
        '';

      if (!alternateClassName && !consequentClassName) {
        return null;
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
    .filter(Boolean)
    .reduce(
      (acc, val) => (acc && val ? t.binaryExpression('+', acc, val) : val),
      null
    );

  return ternaryExpression || null;
}
