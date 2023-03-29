import type { UserConfigurableOptions } from './utils/ast/extractStyles';
import type { Volume } from 'memfs';
import type {
  CacheObject,
  GetClassNameForKeyFn,
} from '../../jsxstyle-utils/src';

export type LoaderOptions = UserConfigurableOptions;

export interface JsxstyleWebpackPluginOptions extends UserConfigurableOptions {
  /** An array of absolute paths to modules that should be compiled by webpack */
  staticModules?: string[];

  /** If set to `'hash'`, use content-based hashes to generate classNames */
  classNameFormat?: 'hash';

  /**
   * An absolute path to a file that will be used to store jsxstyle class name cache information between builds.
   *
   * If `cacheFile` is set, the file will be created if it does not exist and will be overwritten every time `jsxstyle-webpack-plugin` runs.
   */
  cacheFile?: string;

  /**
   * An object that will be used to cache the mapping of CSS rules to classnames.
   *
   * The contents of this object will be stringified and written to disk if `cacheFile` is set.
   */
  cacheObject?: CacheObject;
}

export interface PluginContext {
  /** Loader options set by the plugin. These options can overridden on a per-loader basis. */
  defaultLoaderOptions: Partial<LoaderOptions>;
  getClassNameForKey: GetClassNameForKeyFn;
  getModules: () => Promise<Record<string, unknown>>;
  memoryFS: MemoryFS;
}

export type MemoryFS = InstanceType<typeof Volume>;
