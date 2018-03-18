const t = require('@babel/types');

module.exports = function getSourceModule(
  itemName,
  itemBinding
) {
  // TODO: deal with reassignment
  if (!itemBinding.constant) {
    return null;
  }

  let sourceModule;
  let imported;
  let local;
  let destructured;
  let usesImportSyntax = false;

  const itemNode = itemBinding.path.node;

  if (
    // import x from 'y';
    t.isImportDefaultSpecifier(itemNode) ||
    // import {x} from 'y';
    t.isImportSpecifier(itemNode)
  ) {
    if (t.isImportDeclaration(itemBinding.path.parent)) {
      sourceModule = itemBinding.path.parent.source.value;
      local = itemNode.local.name;
      usesImportSyntax = true;
      if (t.isImportSpecifier(itemNode)) {
        imported = itemNode.imported.name;
        destructured = true;
      } else {
        imported = itemNode.local.name;
        destructured = false;
      }
    }
  } else if (
    t.isVariableDeclarator(itemNode) &&
    itemNode.init != null &&
    t.isCallExpression(itemNode.init) &&
    t.isIdentifier(itemNode.init.callee) &&
    itemNode.init.callee.name === 'require' &&
    itemNode.init.arguments.length === 1
  ) {
    const firstArg = itemNode.init.arguments[0];
    if (!t.isStringLiteral(firstArg)) return null;
    sourceModule = firstArg.value;

    if (t.isIdentifier(itemNode.id)) {
      local = itemNode.id.name;
      imported = itemNode.id.name;
      destructured = false;
    } else if (t.isObjectPattern(itemNode.id)) {
      for (const objProp of itemNode.id.properties) {
        if (
          t.isObjectProperty(objProp) &&
          t.isIdentifier(objProp.value) &&
          objProp.value.name === itemName
        ) {
          local = objProp.value.name;
          imported = objProp.key.name;
          destructured = true;
          break;
        }
      }

      if (!local || !imported) {
        console.error('could not find prop with value `%s`', itemName);
        return null;
      }
    } else {
      console.error('Unhandled id type: %s', itemNode.id.type);
      return null;
    }
  } else {
    return null;
  }

  return {
    sourceModule,
    imported,
    local,
    destructured,
    usesImportSyntax,
  };
}
