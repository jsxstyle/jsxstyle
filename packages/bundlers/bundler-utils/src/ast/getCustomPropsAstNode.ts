import type { NestedCustomPropsObject } from '@jsxstyle/core';
import * as t from '@babel/types';

export const getCustomPropsAstNode = (
  customProps: NestedCustomPropsObject
): t.ObjectProperty[] => {
  const objectProperties: t.ObjectProperty[] = [];
  for (const key in customProps) {
    const value = customProps[key];
    if (typeof value === 'string' || typeof value === 'number') {
      objectProperties.push(
        t.objectProperty(t.identifier(key), t.stringLiteral(value + ''))
      );
    } else {
      objectProperties.push(
        t.objectProperty(
          t.identifier(key),
          t.objectExpression(
            getCustomPropsAstNode(value as NestedCustomPropsObject)
          )
        )
      );
    }
  }
  return objectProperties;
};
