import { ExtractStylesOptions } from './utils/ast/extractStyles';
import type { Volume } from 'memfs';

export interface CacheObject {
  [key: string]: any;
}

export interface LoaderOptions extends ExtractStylesOptions {
  cacheFile?: string;
}

export interface PluginContext {
  cacheFile: string | null;
  cacheObject: CacheObject;
  memoryFS: MemoryFS;
  modulesByAbsolutePath: Record<string, unknown>;
}

export type MemoryFS = InstanceType<typeof Volume>;
