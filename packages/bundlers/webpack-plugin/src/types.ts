import type { PluginOptions } from '@jsxstyle/bundler-utils';
import type { MemoryFS } from '@jsxstyle/bundler-utils';

export interface JsxstyleWebpackPluginOptions extends PluginOptions {
  /** Cache object for persistent class name mapping (shared across builds) */
  cacheObject?: Record<string, string>;
}

export interface PluginContext {
  pluginOptions: PluginOptions;
  cacheObject: Record<string, string>;
  memoryFS: MemoryFS;
}
