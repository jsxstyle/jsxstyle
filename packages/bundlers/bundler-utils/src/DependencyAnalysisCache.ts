import { transform } from './index.js';
import type { PluginTransformResult } from './types.js';

/**
 * Caches transform results for dependency modules to avoid redundant work.
 *
 * When a jsxstyle-consuming module is being transformed, its dependencies are
 * proactively analyzed via `transform()` to extract their static exports.
 * The results are cached so that when the bundler later processes those
 * dependencies through its normal pipeline, the cached result can be returned.
 */
export class DependencyAnalysisCache {
  private cache = new Map<string, PluginTransformResult>();

  /**
   * Analyze a dependency module and return its static exports.
   * Results are cached by absolute path.
   */
  analyze(
    absolutePath: string,
    source: string,
    options: {
      classNameStrategy?: 'counter' | 'hash';
      classNamePrefix?: string;
      debugClassNames?: boolean;
      cacheObject?: Record<string, string>;
      noRuntime?: 'warn' | 'error';
    }
  ): Record<string, unknown> {
    const cached = this.cache.get(absolutePath);
    if (cached) return cached.staticExports;

    const result = transform(source, absolutePath, options);
    this.cache.set(absolutePath, result);
    return result.staticExports;
  }

  /** Return a previously cached transform result (avoids redundant work in bundler pipeline). */
  getCachedResult(absolutePath: string): PluginTransformResult | undefined {
    return this.cache.get(absolutePath);
  }

  /** Invalidate a cached entry (e.g., on file change in watch mode). */
  invalidate(absolutePath: string): void {
    this.cache.delete(absolutePath);
  }
}
