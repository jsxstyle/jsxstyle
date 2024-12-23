import type { CustomPropsObject } from '@jsxstyle/core';
import * as t from '@babel/types';

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
    if (typeof value === 'string' || typeof value === 'number') {
      objectProperties.push(
        t.objectProperty(t.identifier(key), t.stringLiteral(value + ''))
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
