'use strict';

const t = require('babel-types');

function getSourceModuleForItem(node, scope) {
  let itemBinding = null;
  const itemName = node.name.name;

  if (!t.isJSXIdentifier(node.name)) {
    return null;
  }

  if (scope.hasBinding(itemName)) {
    itemBinding = scope.getBinding(itemName);
  } else {
    console.error('Item `%s` is not in scope', itemName);
    return null;
  }

  // TODO: deal with reassignment
  if (!itemBinding.constant) {
    console.error('Item `%s` has been reassigned', itemName);
    return null;
  }

  let sourceModule;
  let imported;
  let local;

  if (t.isImportSpecifier(itemBinding.path.node)) {
    if (t.isImportDeclaration(itemBinding.path.parent) && t.isStringLiteral(itemBinding.path.parent.source)) {
      sourceModule = itemBinding.path.parent.source.value;
      local = itemBinding.path.node.local.name;
      imported = itemBinding.path.node.imported.name;
    }
  } else if (t.isVariableDeclarator(itemBinding.path.node)) {
    if (
      t.isCallExpression(itemBinding.path.node.init) &&
      t.isIdentifier(itemBinding.path.node.init.callee) &&
      itemBinding.path.node.init.callee.name === 'require' &&
      t.isStringLiteral(itemBinding.path.node.init.arguments[0])
    ) {
      sourceModule = itemBinding.path.node.init.arguments[0].value;

      // TODO: better way to get ObjectProperty
      const objProp = itemBinding.path.node.id.properties.find(
        p => t.isIdentifier(p.value) && p.value.name === itemName
      );

      if (!objProp) {
        console.error('could not find prop with value `%s`', itemName);
        return null;
      }

      local = objProp.value.name;
      imported = objProp.key.name;
    }
  } else {
    return null;
  }

  return {
    sourceModule,
    imported,
    local,
  };
}

module.exports = getSourceModuleForItem;
