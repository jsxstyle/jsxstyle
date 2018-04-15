import babylon = require('babylon');

// https://github.com/babel/babel/tree/master/packages/babylon#plugins
// TODO: replace with babylon.PluginName
export type BabylonPlugin =
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

export default function parse(
  code: string | Buffer,
  plugins: BabylonPlugin[] = []
): any {
  return babylon.parse(code.toString(), {
    sourceType: 'module',
    plugins: Array.from(
      new Set<BabylonPlugin>([
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
