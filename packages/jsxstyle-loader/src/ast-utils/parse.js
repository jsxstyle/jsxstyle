'use strict';

const babylon = require('babylon');

function parse(src) {
  return babylon.parse(src, {
    sourceType: 'module',
    plugins: ['jsx', 'objectRestSpread'],
  });
}

module.exports = parse;
