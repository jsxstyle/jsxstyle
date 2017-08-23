'use strict';

const babylon = require('babylon');

function parse(src, plugins) {
  return babylon.parse(src, {
    sourceType: 'module',
    plugins: Array.from(
      new Set(
        [
          'asyncGenerators',
          'classProperties',
          'dynamicImport',
          'functionBind',
          'jsx',
          'objectRestSpread',
        ].concat(plugins)
      )
    ),
  });
}

module.exports = parse;
