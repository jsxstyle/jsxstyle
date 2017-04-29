'use strict';

const babylon = require('babylon');
const recast = require('recast');

// parse parse parse :/
function parse(src, options) {
  return recast.parse(
    src,
    Object.assign({}, options, {
      parser: {
        parse: source =>
          babylon.parse(source, {
            sourceType: 'module',
            plugins: ['jsx', 'objectRestSpread'],
          }),
      },
    })
  );
}

module.exports = parse;
