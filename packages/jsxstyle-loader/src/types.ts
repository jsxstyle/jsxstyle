import { Dict, CSSProperties } from 'jsxstyle-utils';
import t = require('@babel/types');

export type StyleProps = { mediaQueries?: Dict<string> } & CSSProperties;

export interface CacheObject {
  [key: string]: any;
}

export interface LoaderContext {
  cacheFile: string | null;
  cacheObject: CacheObject;
  memoryFS: any;
  fileList: Set<string>;
}

export interface StaticTernary {
  name: string;
  test: t.Expression;
  consequent: string | null;
  alternate: string | null;
}

// https://github.com/babel/babel/tree/master/packages/babylon#plugins
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
