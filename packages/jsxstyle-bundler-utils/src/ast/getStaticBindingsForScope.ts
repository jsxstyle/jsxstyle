import * as path from 'node:path';
import type { Binding, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import invariant from 'invariant';
import { isObject } from 'jsxstyle/utils';

import { evaluateAstNode } from './evaluateAstNode';
import { getSourceModule } from './getSourceModule';

export const extensionRegex = /\.(?:[jt]sx?|json)$/;

export function getStaticBindingsForScope(
  scope: Scope,
  modulesByAbsolutePath: Record<string, unknown> | undefined,
  sourceFileName: string,
  bindingCache: Record<string, string | null>
): Record<string, any> {
  const bindings: Record<string, Binding> = scope.getAllBindings() as any;
  const ret: Record<string, any> = {};
  const sourceDir = path.dirname(sourceFileName);

  invariant(bindingCache, 'bindingCache is a required param');

  for (const [k, binding] of Object.entries(bindings)) {
    // check to see if the item is a module
    const sourceModule = getSourceModule(k, binding);
    if (sourceModule) {
      if (!sourceModule.sourceModule) {
        continue;
      }
      let moduleName = sourceModule.sourceModule;

      // if modulePath is an absolute or relative path
      if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
        // get absolute path
        moduleName = path.resolve(
          sourceDir,
          moduleName.replace(extensionRegex, '')
        );
      }

      if (modulesByAbsolutePath?.hasOwnProperty(moduleName)) {
        const src = modulesByAbsolutePath[moduleName];
        if (!isObject(src)) {
          continue;
        }
        if (sourceModule.destructured) {
          if (sourceModule.imported) {
            ret[k] = src[sourceModule.imported];
          }
        } else {
          // crude esmodule check
          // TODO: make sure this actually works
          if (src?.__esModule) {
            ret[k] = src.default;
          } else {
            ret[k] = src;
          }
        }
      }
      continue;
    }

    const { parent, parentPath } = binding.path;

    if (!t.isVariableDeclaration(parent) || parent.kind !== 'const') {
      continue;
    }

    // pick out the right variable declarator
    const dec = parent.declarations.find(
      (d) => t.isIdentifier(d.id) && d.id.name === k
    );

    // if init is not set, there's nothing to evaluate
    // TODO: handle spread syntax
    if (!dec || !dec.init) {
      continue;
    }

    // missing start/end will break caching
    if (typeof dec.id.start !== 'number' || typeof dec.id.end !== 'number') {
      console.error('dec.id.start/end is not a number');
      continue;
    }

    if (!t.isIdentifier(dec.id)) {
      console.error('dec is not an identifier');
      continue;
    }

    const cacheKey = `${dec.id.name}_${dec.id.start}-${dec.id.end}`;

    // retrieve value from cache
    if (bindingCache.hasOwnProperty(cacheKey)) {
      ret[k] = bindingCache[cacheKey];
      continue;
    }

    // skip ObjectExpressions not defined in the root
    if (
      t.isObjectExpression(dec.init) &&
      parentPath?.parentPath?.type !== 'Program'
    ) {
      continue;
    }

    // evaluate
    try {
      ret[k] = evaluateAstNode(dec.init);
      bindingCache[cacheKey] = ret[k];
    } catch (e) {
      // console.error('evaluateAstNode could not eval dec.init:', e);
    }
  }

  return ret;
}
