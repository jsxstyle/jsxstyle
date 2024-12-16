import * as vm from 'node:vm';
import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { isObject } from '@jsxstyle/core';
import { generate } from './babelUtils.js';
import { evaluateAstNode } from './evaluateAstNode.js';
import { getStaticBindingsForScope } from './getStaticBindingsForScope.js';

export function getEvaluateAstNodeWithScopeFunction(
  traversePath: NodePath,
  modulesByAbsolutePath: Record<string, unknown> | undefined,
  sourceFileName: string,
  bindingCache: Record<string, string | null>
) {
  // Generate scope object at this level
  const staticNamespace = getStaticBindingsForScope(
    traversePath.scope,
    modulesByAbsolutePath,
    sourceFileName,
    bindingCache
  );

  const evalContext = vm.createContext(staticNamespace);

  // called when evaluateAstNode encounters a dynamic-looking prop
  const evalFn = (n: t.Node) => {
    // easy bail case number one: identifiers
    if (n.type === 'Identifier' && staticNamespace.hasOwnProperty(n.name)) {
      return staticNamespace[n.name];
    }

    // easy bail case number two: simple member expressions
    if (
      n.type === 'MemberExpression' &&
      n.object.type === 'Identifier' &&
      n.property.type === 'Identifier'
    ) {
      const obj = staticNamespace[n.object.name];
      if (isObject(obj)) {
        return obj[n.property.name];
      }
    }

    // otherwise, evaluate in context
    return vm.runInContext(`(${generate(n).code})`, evalContext);
  };

  return function evaluateAstNodeWithScope(n: t.Node) {
    return evaluateAstNode(n, evalFn);
  };
}
