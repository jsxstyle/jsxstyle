import * as t from '@babel/types';
import { generate } from './babelUtils.js';
import { evaluateAttributes } from './evaluateAttributes.js';
import type { OptionsObject } from './extractStyles.js';
import { flattenSpreadAttributes } from './flattenSpreadAttributes.js';
import { getJsxAttribute } from './getJsxAttribute.js';
import { joinStringExpressions } from './joinStringExpressions.js';
import { convertStyleObjectToClassNameNode } from './styleObjectUtils.js';

/**
 * This function extracts all static styles from the provided `JSXElement`
 * and returns a new replacement `JSXElement`.
 *
 * Assumptions:
 *  - The provided `JSXElement` has been verified to be a jsxstyle element
 *  - `boxComponentName` points to a `Box` jsxstyle component import
 */
export const handleJsxElement = (
  jsxElement: t.JSXElement,
  initialStyles: t.JSXAttribute[],
  boxComponentName: string,
  options: OptionsObject
): t.JSXElement => {
  const {
    attemptEval,
    classPropName,
    getClassNameForKey,
    onInsertRule,
    noRuntime,
    logWarning,
    logError,
  } = options;

  const attributeMap = flattenSpreadAttributes(
    [...initialStyles, ...jsxElement.openingElement.attributes],
    attemptEval
  );

  const { classNameNode, componentProps, runtimeRequired, styleObj } =
    evaluateAttributes(attributeMap, options);

  let componentName: t.JSXIdentifier | t.JSXMemberExpression | null = null;
  if (!runtimeRequired) {
    const componentProp = componentProps.get('component');
    if (!componentProp) {
      componentName = t.jsxIdentifier('div');
    } else if (
      componentProp.type === 'Identifier' &&
      componentProp.name[0]?.toUpperCase() === componentProp.name[0]
    ) {
      componentName = t.jsxIdentifier(componentProp.name);
    } else if (
      componentProp.type === 'StringLiteral' &&
      componentProp.value[0]?.toLowerCase() === componentProp.value[0]
    ) {
      componentName = t.jsxIdentifier(componentProp.value);
    } else if (
      componentProp.type === 'MemberExpression' &&
      componentProp.object.type === 'Identifier' &&
      componentProp.property.type === 'Identifier'
    ) {
      componentName = t.jsxMemberExpression(
        t.jsxIdentifier(componentProp.object.name),
        t.jsxIdentifier(componentProp.property.name)
      );
    } else {
      const logFn = noRuntime ? logError : logWarning;
      logFn(
        'Component prop value `%s` could not be safely extracted.',
        generate(componentProp).code
      );
    }

    if (componentName) {
      componentProps.delete('component');
    }
  }

  const propsComponent = componentName && componentProps.get('props');
  if (propsComponent) {
    componentProps.delete('props');
  }

  const classNameExpression = convertStyleObjectToClassNameNode(
    styleObj,
    getClassNameForKey,
    onInsertRule
  );

  const processedAttributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> =
    Array.from(componentProps.entries()).map((entry) =>
      getJsxAttribute(...entry)
    );

  if (propsComponent) {
    processedAttributes.push(t.jsxSpreadAttribute(propsComponent));
  }

  processedAttributes.push(
    getJsxAttribute(
      classPropName,
      joinStringExpressions(classNameNode, classNameExpression)
    )
  );

  const updatedElement = { ...jsxElement };

  updatedElement.openingElement.attributes = processedAttributes;
  updatedElement.openingElement.name =
    componentName || t.jsxIdentifier(boxComponentName);
  if (updatedElement.closingElement?.name) {
    updatedElement.closingElement.name =
      componentName || t.jsxIdentifier(boxComponentName);
  }

  return updatedElement;
};
