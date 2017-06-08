'use strict';

const t = require('babel-types');
const path = require('path');
const generate = require('babel-generator').default;
const invariant = require('invariant');
const vm = require('vm');

const canEvaluate = require('./canEvaluate');
const getSourceModule = require('./getSourceModule');

function getStaticBindingsForScope(scope, whitelist = [], sourceFileName) {
  const bindings = scope.getAllBindings();
  const ret = {};

  const sourceDir = path.dirname(sourceFileName);

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
        if (!/\.[a-z]{2,4}$/.test(moduleName)) {
          moduleName += '.js';
        }
        // get absolute path
        moduleName = path.resolve(sourceDir, moduleName);
      }

      if (whitelist.indexOf(moduleName) > -1) {
        ret[k] = require(moduleName);
      }
      continue;
    } else if (t.isVariableDeclaration(binding.path.parent)) {
      // console.log(generate(binding.path.parent.node).code);
      // pick out the right variable declarator
      const dec = binding.path.parent.declarations.find(
        d => t.isIdentifier(d.id) && d.id.name === k
      );
      // TODO: handle spread syntax
      if (!dec) continue;

      if (canEvaluate(null, dec.init)) {
        ret[k] = vm.runInNewContext(generate(dec.init).code);
      }
    } else {
      console.error(
        'Unhandled parent type for `%s` in getStaticBindingsForScope: %s\n\n---\n%s\n---\n',
        k,
        binding.path.parent.type,
        generate(binding.path.parent).code
      );
    }
  }

  return ret;
}

module.exports = getStaticBindingsForScope;
