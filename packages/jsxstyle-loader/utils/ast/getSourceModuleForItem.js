'use strict';

const getSourceModule = require('./getSourceModule');

function getSourceModuleForItem(itemName, scope, warnCallback) {
  let itemBinding = null;

  if (scope.hasBinding(itemName)) {
    itemBinding = scope.getBinding(itemName);
  } else {
    warnCallback('Item `%s` is not in scope', itemName);
    return null;
  }

  return getSourceModule(itemName, itemBinding);
}

module.exports = getSourceModuleForItem;
