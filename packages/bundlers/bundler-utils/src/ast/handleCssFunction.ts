import * as t from '@babel/types';
import { processProps } from '@jsxstyle/core';
import invariant from 'invariant';
import { generate } from './babelUtils.js';
import { evaluateAttributes } from './evaluateAttributes.js';
import type { OptionsObject } from './extractStyles.js';
import { flattenSpreadAttributes } from './flattenSpreadAttributes.js';
import { getObjectProperty } from './getObjectProperty.js';
import { joinStringExpressions } from './joinStringExpressions.js';
import { normalizeTernary } from './normalizeTernary.js';
import { convertStyleObjectToClassNameNode } from './styleObjectUtils.js';

const addTestToProps = (
  test: t.Expression,
  properties: t.ObjectExpression['properties']
): t.ObjectProperty[] => {
  const objectProperties: t.ObjectProperty[] = [];
  for (const prop of properties) {
    invariant(
      prop.type === 'ObjectProperty',
      'Unsupported property type `%s',
      prop.type
    );
    invariant(
      prop.value.type !== 'RestElement' &&
        prop.value.type !== 'AssignmentPattern' &&
        prop.value.type !== 'ArrayPattern' &&
        prop.value.type !== 'ObjectPattern',
      'Unsupported property value type `%s`',
      prop.value.type
    );
    objectProperties.push({
      ...prop,
      value: t.logicalExpression('&&', test, prop.value),
    });
  }
  return objectProperties;
};

/**
 * This function extracts all static styles from the AST node for a `css`
 * function call and returns either a `StringLiteral` with the extracted
 * class names or a `BinaryExpression` that combines extracted class names with
 * a `css` function call containing only non-static object properties.
 */
export const handleCssFunction = (
  callExpression: t.CallExpression,
  options: OptionsObject
): t.BinaryExpression | t.StringLiteral | t.CallExpression => {
  const {
    attemptEval,
    classPropName,
    getClassNameForKey,
    onInsertRule: insertRuleCallback,
    logWarning,
    logError,
    noRuntime,
  } = options;

  const logFn = noRuntime ? logError : logWarning;

  const getClassNameNode = (props: Record<string, any>) => {
    const processedProps = processProps(
      props,
      classPropName,
      getClassNameForKey,
      insertRuleCallback
    );
    const className = processedProps?.[classPropName];
    if (typeof className !== 'string') return null;
    return t.stringLiteral(className);
  };

  // expressions that must stay as css function params
  const unextractables: t.CallExpression['arguments'] = [];
  const extractedClassNames: t.Expression[] = [];

  const normalizedArguments: t.CallExpression['arguments'] = [];

  // flatten ternaries with object-type alternates/consequents down to an object with the ternary test on each key
  for (const arg of callExpression.arguments) {
    if (
      arg.type === 'LogicalExpression' ||
      arg.type === 'ConditionalExpression'
    ) {
      try {
        const { test, consequent, alternate } = normalizeTernary(arg);
        const normalizedProperties: t.ObjectProperty[] = [];

        if (consequent.type === 'ObjectExpression') {
          normalizedProperties.push(
            ...addTestToProps(test, consequent.properties)
          );
        } else if (consequent.type !== 'NullLiteral') {
          normalizedArguments.push(t.logicalExpression('&&', test, consequent));
        }

        const flippedTest = t.unaryExpression('!', test);
        if (alternate.type === 'ObjectExpression') {
          normalizedProperties.push(
            ...addTestToProps(flippedTest, alternate.properties)
          );
        } else if (alternate.type !== 'NullLiteral') {
          normalizedArguments.push(
            t.logicalExpression('&&', flippedTest, alternate)
          );
        }

        if (normalizedProperties.length > 0) {
          normalizedArguments.push(t.objectExpression(normalizedProperties));
        }
      } catch (error) {
        normalizedArguments.push(arg);
      }
    } else {
      normalizedArguments.push(arg);
    }
  }

  for (const arg of normalizedArguments) {
    if (arg.type === 'ObjectExpression') {
      const properties = arg.properties;

      const attributeMap = flattenSpreadAttributes(properties, attemptEval);
      const { componentProps, runtimeRequired, styleObj } = evaluateAttributes(
        attributeMap,
        options
      );

      const classNameExpression = convertStyleObjectToClassNameNode(
        getClassNameNode,
        styleObj
      );

      extractedClassNames.push(classNameExpression);
      if (runtimeRequired) {
        unextractables.push(
          t.objectExpression(
            Array.from(componentProps.entries()).map((entry) =>
              getObjectProperty(...entry)
            )
          )
        );
      }
    } else if (arg.type === 'StringLiteral') {
      extractedClassNames.push(arg);
    } else {
      logFn(
        'Argument `%s` cannot be extracted from the following expression: `%s`',
        generate(arg).code,
        generate(callExpression).code
      );
      if (arg.type === 'SpreadElement' || arg.type === 'ArgumentPlaceholder') {
        return callExpression;
      }
      unextractables.push(arg);
    }
  }

  if (unextractables.length > 0) {
    extractedClassNames.push(
      t.callExpression(callExpression.callee, unextractables)
    );
  }

  return joinStringExpressions(...extractedClassNames);
};
