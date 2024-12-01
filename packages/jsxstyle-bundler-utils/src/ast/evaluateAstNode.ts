import * as t from '@babel/types';
import invariant from 'invariant';
import { generate } from './babelUtils';

export function evaluateAstNode(
  exprNode: t.Node,
  evalFn?: (node: t.Node) => any
): any {
  if (exprNode == null) {
    return exprNode;
  }

  // loop through ObjectExpression keys
  if (t.isObjectExpression(exprNode)) {
    const ret: Record<string, any> = {};
    for (const value of exprNode.properties) {
      invariant(
        t.isObjectProperty(value),
        'evaluateAstNode can only evaluate object properties'
      );

      let key: string | number | null | undefined | boolean;
      if (value.computed) {
        key = evaluateAstNode(value.key, evalFn);
      } else if (t.isIdentifier(value.key)) {
        key = value.key.name;
      } else if (
        t.isStringLiteral(value.key) ||
        t.isNumericLiteral(value.key)
      ) {
        key = value.key.value;
      } else {
        throw new Error('Unsupported key type: ' + value.key.type);
      }

      invariant(
        typeof key === 'string' || typeof key === 'number',
        'key must be either a string or a number'
      );

      ret[key] = evaluateAstNode(value.value, evalFn);
    }
    return ret;
  }

  if (t.isUnaryExpression(exprNode) && exprNode.operator === '-') {
    const ret = evaluateAstNode(exprNode.argument, evalFn);
    if (ret == null) {
      return null;
    }
    return -ret;
  }

  if (t.isTemplateLiteral(exprNode)) {
    let ret = '';
    for (let idx = 0, len = exprNode.quasis.length; idx < len; idx++) {
      const quasi = exprNode.quasis[idx];
      const expr = exprNode.expressions[idx];
      if (quasi) {
        ret += quasi.value.raw;
      }
      if (expr) {
        ret += evaluateAstNode(expr, evalFn);
      }
    }
    return ret;
  }

  if (t.isNullLiteral(exprNode)) {
    return null;
  }

  if (t.isIdentifier(exprNode) && exprNode.name === 'undefined') {
    return undefined;
  }

  if (t.isNumericLiteral(exprNode) || t.isStringLiteral(exprNode)) {
    return exprNode.value;
  }

  if (t.isBooleanLiteral(exprNode)) {
    return exprNode.value;
  }

  if (t.isBinaryExpression(exprNode)) {
    const left = evaluateAstNode(exprNode.left, evalFn);
    const right = evaluateAstNode(exprNode.right, evalFn);
    if (exprNode.operator === '+') return left + right;
    if (exprNode.operator === '-') return left - right;
    if (exprNode.operator === '*') return left * right;
    if (exprNode.operator === '/') return left / right;
  }

  // TODO: member expression?

  // if we've made it this far, the value has to be evaluated
  if (typeof evalFn !== 'function') {
    invariant(
      false,
      'evaluateAstNode does not support non-literal values unless an eval function is provided: `%s`',
      generate(exprNode).code
    );
  }

  return evalFn(exprNode);
}
