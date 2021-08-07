import { UserConfigurableOptions } from './utils/ast/extractStyles';
import type { Volume } from 'memfs';

export interface CacheObject {
  [key: string]: any;
}

export interface LoaderOptions extends UserConfigurableOptions {}

export interface PluginContext {
  /** Loader options set by the plugin. These options can overridden on a per-loader basis. */
  defaultLoaderOptions: Partial<LoaderOptions>;
  getClassNameForKey: (key: string) => string;
  getModules: () => Promise<Record<string, unknown>>;
  memoryFS: MemoryFS;
}

export type MemoryFS = InstanceType<typeof Volume>;
