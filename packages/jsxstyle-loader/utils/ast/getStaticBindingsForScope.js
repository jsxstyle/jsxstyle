'use strict';

const invariant = require('invariant');
const path = require('path');
const t = require('@babel/types');

const getSourceModule = require('./getSourceModule');
const evaluateAstNode = require('./evaluateAstNode');

function getStaticBindingsForScope(
  scope,
  whitelist = [],
  sourceFileName,
  bindingCache
) {
  const bindings = scope.getAllBindings();
  const ret = {};

  const sourceDir = path.dirname(sourceFileName);

  invariant(bindingCache, 'bindingCache is a required param');

  for (const k in bindings) {
    const binding = bindings[k];

    // check to see if the item is a module
    const sourceModule = getSourceModule(k, binding);
    if (sourceModule) {
      let moduleName = sourceModule.sourceModule;

      // if modulePath is an absolute or relative path
      if (
        sourceModule.sourceModule.startsWith('.') ||
        sourceModule.sourceModule.startsWith('/')
      ) {
        // if moduleName doesn't end with an extension, add .js
        if (path.extname(moduleName) === '') {
          moduleName += '.js';
        }
        // get absolute path
        moduleName = path.resolve(sourceDir, moduleName);
      }

      if (whitelist.indexOf(moduleName) > -1) {
        const src = require(moduleName);
        if (sourceModule.destructured) {
          ret[k] = src[sourceModule.imported];
        } else {
          // crude esmodule check
          // TODO: make sure this actually works
          if (src && src.__esModule) {
            ret[k] = src.default;
          } else {
            ret[k] = src;
          }
        }
      }
      continue;
    } else if (
      t.isVariableDeclaration(binding.path.parent) &&
      binding.path.parent.kind === 'const'
    ) {
      // pick out the right variable declarator
      const dec = binding.path.parent.declarations.find(
        d => t.isIdentifier(d.id) && d.id.name === k
      );
      // TODO: handle spread syntax
      if (!dec) continue;

      const cacheKey = `${dec.id.name}_${dec.init.start}-${dec.init.end}`;

      if (t.isObjectExpression(dec.init)) {
        if (binding.path.parentPath.parentPath.type === 'Program') {
          // retrieve value from cache
          if (bindingCache.hasOwnProperty(cacheKey)) {
            ret[k] = bindingCache[cacheKey];
            continue;
          }
          // evaluate
          try {
            ret[k] = evaluateAstNode(dec.init);
            bindingCache[cacheKey] = ret[k];
          } catch (e) {
            // console.error('evaluateAstNode error:', e);
          }
        } else {
          // console.error('ObjectExpressions are only evaled at root.');
        }
        continue;
      }

      // retrieve value from cache
      if (bindingCache.hasOwnProperty(cacheKey)) {
        ret[k] = bindingCache[cacheKey];
        continue;
      }
      // evaluate
      try {
        ret[k] = evaluateAstNode(dec.init);
        bindingCache[cacheKey] = ret[k];
        continue;
      } catch (e) {
        // console.error('evaluateAstNode could not eval dec.init:', e);
      }
    }
  }

  return ret;
}

module.exports = getStaticBindingsForScope;
