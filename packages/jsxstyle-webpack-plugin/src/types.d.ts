import { ExtractStylesOptions } from './utils/ast/extractStyles';
import type { Volume } from 'memfs';
import type { EntrypointCache } from './EntrypointCache';

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
  getModules: () => Promise<Record<string, unknown>>;
}

export type MemoryFS = InstanceType<typeof Volume>;
