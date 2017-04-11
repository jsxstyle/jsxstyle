'use strict';

const stringHash = require('./stringHash');

function getClassName(key, prefix = '_j') {
  return prefix + stringHash(key).toString(36);
}

module.exports = getClassName;
