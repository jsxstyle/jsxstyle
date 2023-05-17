/* eslint-disable no-prototype-builtins */
import generateImport from '@babel/generator';
import traverseImport from '@babel/traverse';
import { parse as babelParse, type ParserPlugin } from '@babel/parser';
import type { File } from '@babel/types';

// TODO(meyer) rollup should do this automatically
const esmInterop = <T>(mod: T): T => {
  return (
    mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod
  ) as any;
};

export const traverse = esmInterop(traverseImport);
export const generate = esmInterop(generateImport);

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
