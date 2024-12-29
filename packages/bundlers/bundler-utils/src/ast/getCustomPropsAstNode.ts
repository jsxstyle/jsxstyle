import type { CustomPropsObject } from '@jsxstyle/core';
import * as t from '@babel/types';

const customPropRegex = /^var\(\-\-(.+?)\)$/;

/**
 * Given a custom properties object, this function returns an array of
 * `ObjectProperty` AST nodes that correspond to the custom properties.
 */
export const getCustomPropsAstNode = (
  customProps: CustomPropsObject
): t.ObjectProperty[] => {
  const objectProperties: t.ObjectProperty[] = [];
  for (const key in customProps) {
    const value = customProps[key];
    if (typeof value === 'string') {
      if (!customPropRegex.test(value)) {
        throw new Error(`Invalid custom property value: "${value}"`);
      }
      objectProperties.push(
        t.objectProperty(t.identifier(key), t.stringLiteral(value))
      );
    } else if (typeof value === 'object') {
      objectProperties.push(
        t.objectProperty(
          t.identifier(key),
          t.objectExpression(getCustomPropsAstNode(value))
        )
      );
    }
  }
  return objectProperties;
};
