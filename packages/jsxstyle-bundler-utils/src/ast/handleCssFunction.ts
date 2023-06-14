import * as t from '@babel/types';
import { processProps } from '../../../jsxstyle-utils/src/processProps';
import { getObjectProperty } from './getObjectProperty';
import { convertStyleObjectToClassNameNode } from './styleObjectUtils';
import { joinStringExpressions } from './joinStringExpressions';
import { flattenSpreadAttributes } from './flattenSpreadAttributes';
import { evaluateAttributes } from './evaluateAttributes';
import type { OptionsObject } from './extractStyles';
import { generate } from './babelUtils';

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

  if (callExpression.arguments.length !== 1) {
    logFn(
      'CSS function has an unexpected number of arguments (%d). Extraction will be skipped.',
      callExpression.arguments.length
    );
    return callExpression;
  }

  const firstArg = callExpression.arguments[0];
  if (firstArg?.type !== 'ObjectExpression') {
    logFn(
      'CSS funtion argument 1 cannot be extracted from the following expression: `%s`',
      generate(callExpression).code
    );
    return callExpression;
  }

  const properties = firstArg.properties;

  const attributeMap = flattenSpreadAttributes(properties, attemptEval);
  const { componentProps, runtimeRequired, styleObj } = evaluateAttributes(
    attributeMap,
    options
  );

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

  const classNameExpression = convertStyleObjectToClassNameNode(
    getClassNameNode,
    styleObj
  );

  if (!runtimeRequired) {
    return classNameExpression;
  }

  return joinStringExpressions(
    classNameExpression,
    t.callExpression(callExpression.callee, [
      t.objectExpression(
        Array.from(componentProps.entries()).map((entry) =>
          getObjectProperty(...entry)
        )
      ),
    ])
  );
};
