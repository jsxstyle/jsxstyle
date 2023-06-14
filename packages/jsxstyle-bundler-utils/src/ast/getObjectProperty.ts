import * as t from '@babel/types';

/** This function generates an `ObjectProperty` from the provided string and AST node */
export const getObjectProperty = (
  key: string,
  node: t.Expression | t.PatternLike
): t.ObjectProperty => {
  return t.objectProperty(t.stringLiteral(key), node);
};
