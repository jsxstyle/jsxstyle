import * as t from '@babel/types';
import type { GetClassNameForKeyFn, InsertRuleCallback } from '@jsxstyle/core';
import { parseStyleProps, processProps } from '@jsxstyle/core';
import { generate } from './babelUtils.js';
import { joinStringExpressions } from './joinStringExpressions.js';

export interface PrimitiveValue {
  type: 'primitive';
  value: unknown;
}

export interface TernaryValue {
  type: 'ternary';
  test: t.Expression;
  alternate: PrimitiveValue | TernaryValue;
  consequent: PrimitiveValue | TernaryValue;
}

export interface NodeValue {
  type: 'node';
  value: t.Expression;
}

export interface StaticStyleObject {
  styles?: Record<string, PrimitiveValue['value']> & {
    [key: `@media ${string}`]: Record<string, PrimitiveValue['value']>;
  };
  ternaries?: Record<
    string,
    {
      test: t.Expression;
      alternate: StaticStyleObject;
      consequent: StaticStyleObject;
    }
  >;
}

export const updateStyleObject = (
  key: string,
  value: PrimitiveValue | TernaryValue,
  styleObj: StaticStyleObject
): void => {
  if (value.type === 'primitive') {
    // biome-ignore lint/suspicious/noAssignInExpressions: chill
    (styleObj.styles ||= {})[key] = value.value;
  } else {
    const ternaryKey = generate(value.test).code;
    // biome-ignore lint/suspicious/noAssignInExpressions: chill
    const nestedThing = ((styleObj.ternaries ||= {})[ternaryKey] ||= {
      test: value.test,
      alternate: {},
      consequent: {},
    });
    updateStyleObject(key, value.alternate, nestedThing.alternate);
    updateStyleObject(key, value.consequent, nestedThing.consequent);
  }
};

export const convertStyleObjectToClassNameNode = (
  styleObj: StaticStyleObject,
  getClassNameForKey: GetClassNameForKeyFn,
  onInsertRule: InsertRuleCallback
) => {
  const nodes: Array<t.StringLiteral | t.ConditionalExpression | null> = [];

  if (styleObj.styles) {
    const parsed = parseStyleProps(styleObj.styles);
    const className = processProps(
      parsed.parsedStyleProps,
      null,
      getClassNameForKey,
      onInsertRule
    );
    if (className) {
      nodes.push(t.stringLiteral(className));
    }
  }

  if (styleObj.ternaries) {
    nodes.push(
      ...Object.values(styleObj.ternaries).map(
        ({ test, alternate, consequent }) => {
          const consequentNode = convertStyleObjectToClassNameNode(
            consequent,
            getClassNameForKey,
            onInsertRule
          );
          const alternateNode = convertStyleObjectToClassNameNode(
            alternate,
            getClassNameForKey,
            onInsertRule
          );
          return t.conditionalExpression(test, consequentNode, alternateNode);
        }
      )
    );
  }

  return joinStringExpressions(...nodes);
};
