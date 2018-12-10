import babelParser = require('@babel/parser');

// https://new.babeljs.io/docs/en/next/babel-parser.html#plugins
// TODO: replace with babelParser.PluginName
export type ParserPlugin =
  | 'asyncGenerators'
  | 'bigInt'
  | 'classPrivateMethods'
  | 'classPrivateProperties'
  | 'classProperties'
  | 'decorators'
  | 'doExpressions'
  | 'dynamicImport'
  | 'estree'
  | 'exportDefaultFrom'
  | 'exportNamespaceFrom'
  | 'flow'
  | 'flowComments'
  | 'functionBind'
  | 'functionSent'
  | 'importMeta'
  | 'jsx'
  | 'nullishCoalescingOperator'
  | 'numericSeparator'
  | 'objectRestSpread'
  | 'optionalCatchBinding'
  | 'optionalChaining'
  | 'pipelineOperator'
  | 'throwExpressions'
  | 'typescript';

export function parse(
  code: string | Buffer,
  plugins: ParserPlugin[] = []
): any {
  return babelParser.parse(code.toString(), {
    plugins: Array.from(
      new Set<ParserPlugin>([
        'asyncGenerators',
        'classProperties',
        'dynamicImport',
        'functionBind',
        'jsx',
        'objectRestSpread',
        ...plugins,
      ])
    ),
    sourceType: 'module',
  });
}
