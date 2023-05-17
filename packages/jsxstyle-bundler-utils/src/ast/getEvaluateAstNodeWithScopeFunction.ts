import * as t from '@babel/types';
import invariant from 'invariant';
import { getStaticBindingsForScope } from './getStaticBindingsForScope';
import type { NodePath } from '@babel/traverse';
import vm from 'vm';
import { generate } from './babelUtils';
import { evaluateAstNode } from './evaluateAstNode';

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
    // variable
    if (t.isIdentifier(n)) {
      invariant(
        staticNamespace.hasOwnProperty(n.name),
        'identifier not in staticNamespace'
      );
      return staticNamespace[n.name];
    }
    return vm.runInContext(`(${generate(n).code})`, evalContext);
  };

  return (n: t.Node) => evaluateAstNode(n, evalFn);
}
