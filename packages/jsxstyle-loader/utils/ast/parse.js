const babylon = require('babylon');

module.exports = function parse(
  code,
  plugins = []
) {
  return babylon.parse(code.toString(), {
    sourceType: 'module',
    plugins: Array.from(
      new Set([
        'asyncGenerators',
        'classProperties',
        'dynamicImport',
        'functionBind',
        'jsx',
        'objectRestSpread',
        ...plugins,
      ])
    ),
  });
}
