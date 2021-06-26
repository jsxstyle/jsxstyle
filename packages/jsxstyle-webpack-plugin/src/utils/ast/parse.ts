import babelParser = require('@babel/parser');
import type { File } from '@babel/types';

export function parse(
  code: string | Buffer,
  plugins: babelParser.ParserPlugin[] = []
): File {
  return babelParser.parse(code.toString(), {
    plugins: [
      'asyncGenerators',
      'classProperties',
      'dynamicImport',
      'functionBind',
      'jsx',
      'nullishCoalescingOperator',
      'numericSeparator',
      'objectRestSpread',
      'optionalCatchBinding',
      'optionalChaining',
      ['decorators', { decoratorsBeforeExport: true }],
      ...plugins,
    ],
    sourceType: 'module',
  });
}
