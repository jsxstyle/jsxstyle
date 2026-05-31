import fs from 'node:fs';
import { createRequire } from 'node:module';
import { Volume } from 'memfs';
// @ts-expect-error this export is not exposed in the `compiler.webpack` object
import NodeWatchFileSystem from 'webpack/lib/node/NodeWatchFileSystem.js';

import { validateOptions, wrapFileSystem } from '@jsxstyle/bundler-utils';
import type { JsxstyleWebpackPluginOptions, PluginContext } from './types.js';

// TODO(meyer) replace this with `import.meta.resolve` (node 20+) some time after node 18 is no longer LTS
const customRequire = createRequire(import.meta.url);

type Compiler = import('webpack').Compiler;
type WebpackPluginInstance = import('webpack').WebpackPluginInstance;

const pluginName = 'JsxstyleWebpackPlugin';

export class JsxstyleWebpackPlugin implements WebpackPluginInstance {
  constructor({
    cacheFile,
    cacheObject = {},
    ...pluginOptions
  }: JsxstyleWebpackPluginOptions = {}) {
    // Validate shared plugin options (extensions, classNameStrategy, etc.)
    validateOptions(
      'jsxstyle-webpack-plugin',
      pluginOptions as Record<string, unknown>
    );

    if (typeof cacheFile === 'string') {
      try {
        const cacheFileContents = fs.readFileSync(cacheFile, {
          encoding: 'utf8',
          flag: 'r',
        });

        // Populate cacheObject from existing cache file
        const lines = new Set<string>(cacheFileContents.trim().split('\n'));
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            // Pre-populate cache: use the line as both key and placeholder value.
            // The Rust transform will use this cache for consistent class names.
            cacheObject[trimmedLine] = cacheObject[trimmedLine] || '';
          }
        }
      } catch (err: any) {
        if (err.code === 'EISDIR') {
          throw new Error(
            `Value of cacheFile (\`${cacheFile}\`) is a directory`
          );
        }
      }

      this.donePlugin = (): void => {
        try {
          // write contents of cache object as a newline-separated list of CSS strings
          const cacheString =
            Object.keys(cacheObject).filter(Boolean).join('\n') + '\n';
          fs.writeFileSync(cacheFile, cacheString, 'utf8');
        } catch {
          console.error('Could not write cache file to `%s`', cacheFile);
        }
      };
    }

    this.memoryFS = new Volume();

    // Context object that gets passed to each loader.
    // Available in each loader as this[Symbol.for('jsxstyle-webpack-plugin')]
    this.ctx = {
      pluginOptions: { ...pluginOptions, cacheFile },
      cacheObject,
      memoryFS: this.memoryFS,
    };
  }

  public static loader = customRequire.resolve(
    '@jsxstyle/webpack-plugin/loader'
  );

  private ctx: PluginContext;
  private memoryFS = new Volume();

  private nmlPlugin = (loaderContext: any): void => {
    loaderContext[Symbol.for('jsxstyle-webpack-plugin')] = this.ctx;
  };

  /** conditionally set based on whether or not we have a `cacheFile` */
  private donePlugin: (() => void) | null = null;

  public apply(compiler: Compiler): void {
    // Default debugClassNames to true in development mode
    if (this.ctx.pluginOptions.debugClassNames === undefined) {
      this.ctx.pluginOptions = {
        ...this.ctx.pluginOptions,
        debugClassNames: compiler.options.mode === 'development',
      };
    }

    const environmentPlugin = (): void => {
      if (!compiler.inputFileSystem) {
        throw new Error(
          'Cannot install virtual file system without an inputFileSystem'
        );
      }
      const wrappedFS = wrapFileSystem(compiler.inputFileSystem, this.memoryFS);
      compiler.inputFileSystem = wrappedFS;
      compiler.watchFileSystem = new NodeWatchFileSystem(wrappedFS);
    };

    compiler.hooks.environment.tap(pluginName, environmentPlugin);
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      compiler.webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
        pluginName,
        this.nmlPlugin
      );
    });

    if (this.donePlugin) {
      compiler.hooks.done.tap(pluginName, this.donePlugin);
    }
  }
}
