import * as t from '@babel/types';
import invariant from 'invariant';

/** This function generates a `JSXAttribute` from the provided string and AST node */
export const getJsxAttribute = (
  key: string,
  node: t.Expression | t.PatternLike
): t.JSXAttribute => {
  const jsxKey = t.jsxIdentifier(key);
  if (
    node.type === 'StringLiteral' &&
    !node.value.includes('"') &&
    !node.value.includes("'")
  ) {
    return t.jsxAttribute(jsxKey, node);
  }
  invariant(
    node.type !== 'RestElement' &&
      node.type !== 'ArrayPattern' &&
      node.type !== 'AssignmentPattern' &&
      node.type !== 'ObjectPattern',
    'Unsupported node type: %s',
    node.type
  );
  return t.jsxAttribute(jsxKey, t.jsxExpressionContainer(node));
};
