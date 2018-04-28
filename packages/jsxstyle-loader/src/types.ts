import { CSSProperties, Dict } from 'jsxstyle-utils';
import { ExtractStylesOptions } from './utils/ast/extractStyles';

export type StyleProps = { mediaQueries?: Dict<string> } & CSSProperties;

export interface CacheObject {
  [key: string]: any;
}

export interface LoaderOptions extends ExtractStylesOptions {
  cacheFile?: string;
}

export interface PluginContext {
  cacheFile: string | null;
  cacheObject: CacheObject;
  memoryFS: any;
  fileList: Set<string>;
}
