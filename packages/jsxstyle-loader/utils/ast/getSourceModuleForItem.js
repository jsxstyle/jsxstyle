'use strict';

const getSourceModule = require('./getSourceModule');

function getSourceModuleForItem(itemName, scope, errorCallback) {
  let itemBinding = null;

  if (scope.hasBinding(itemName)) {
    itemBinding = scope.getBinding(itemName);
  } else {
    errorCallback('Item `' + itemName + '` is not in scope', itemName);
    return null;
  }

  return getSourceModule(itemName, itemBinding);
}

module.exports = getSourceModuleForItem;
