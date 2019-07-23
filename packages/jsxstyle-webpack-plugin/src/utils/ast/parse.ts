import babelParser = require('@babel/parser');

export function parse(
  code: string | Buffer,
  plugins: babelParser.ParserPlugin[] = []
): import('@babel/types').File {
  return babelParser.parse(code.toString(), {
    plugins: [
      'asyncGenerators',
      'classProperties',
      'dynamicImport',
      'functionBind',
      'jsx',
      'numericSeparator',
      'objectRestSpread',
      'optionalCatchBinding',
      ...plugins,
    ],
    sourceType: 'module',
  });
}
