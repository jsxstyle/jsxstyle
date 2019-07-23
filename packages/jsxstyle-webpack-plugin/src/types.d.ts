import { ExtractStylesOptions } from './utils/ast/extractStyles';

export interface CacheObject {
  [key: string]: any;
}

export interface LoaderOptions extends ExtractStylesOptions {
  cacheFile?: string;
}

export interface PluginContext {
  cacheFile: string | null;
  cacheObject: CacheObject;
  memoryFS: import('webpack/lib/MemoryOutputFileSystem');
  fileList: Set<string>;
}
