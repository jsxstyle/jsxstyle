import { parse as babelParse, type ParserPlugin } from '@babel/parser';
import type { File } from '@babel/types';

export function parse(
  code: string | Buffer,
  plugins: ParserPlugin[] = []
): File {
  return babelParse(code.toString(), {
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
