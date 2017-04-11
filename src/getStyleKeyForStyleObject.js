'use strict';

function getStyleKeyForStyleObject(styleObject) {
  let serialized = '';
  Object.keys(styleObject).sort().forEach(function(key) {
    let value = styleObject[key];

    if (typeof value !== 'number' && !value) {
      return;
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
      value = value.toString();
    }

    serialized += `${key}:${value};`;
  });

  if (serialized === '') {
    return null;
  }

  return serialized;
}

module.exports = getStyleKeyForStyleObject;
