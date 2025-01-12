import fs from 'node:fs';
import { createClassNameGetter } from '@jsxstyle/core';
import { Volume } from 'memfs';
// @ts-expect-error this export is not exposed in the `compiler.webpack` object
import NodeWatchFileSystem from 'webpack/lib/node/NodeWatchFileSystem.js';

import { createRequire } from 'node:module';
import { ModuleCache } from '@jsxstyle/bundler-utils';
import { wrapFileSystem } from '@jsxstyle/bundler-utils';
import invariant from 'invariant';
import type { JsxstyleWebpackPluginOptions, PluginContext } from './types.js';

// TODO(meyer) replace this with `import.meta.resolve` (node 20+) some time after node 18 is no longer LTS
const customRequire = createRequire(import.meta.url);

type Compilation = import('webpack').Compilation;
type Compiler = import('webpack').Compiler;
type WebpackPluginInstance = import('webpack').WebpackPluginInstance;

const pluginName = 'JsxstyleWebpackPlugin';
const childCompilerName = `${pluginName} compiled modules`;

export class JsxstyleWebpackPlugin implements WebpackPluginInstance {
  constructor({
    cacheFile,
    classNameFormat,
    staticModules,
    cacheObject = {},
    ...loaderOptions
  }: JsxstyleWebpackPluginOptions = {}) {
    const getClassNameForKey = createClassNameGetter(
      cacheObject,
      classNameFormat
    );

    if (typeof cacheFile === 'string') {
      try {
        const cacheFileContents = fs.readFileSync(cacheFile, {
          encoding: 'utf8',
          flag: 'r',
        });

        // create mapping of unique CSS strings to class names
        const lines = new Set<string>(cacheFileContents.trim().split('\n'));
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            // add each line of CSS to the cache
            getClassNameForKey(trimmedLine);
          }
        }
      } catch (err) {
        invariant(
          err.code !== 'EISDIR',
          'Value of cacheFile (`%s`) is a directory',
          cacheFile
        );
      }

      this.donePlugin = (): void => {
        try {
          // write contents of cache object as a newline-separated list of CSS strings
          const cacheString =
            Object.keys(cacheObject).filter(Boolean).join('\n') + '\n';
          fs.writeFileSync(cacheFile, cacheString, 'utf8');
        } catch (err) {
          console.error('Could not write cache file to `%s`', cacheFile);
        }
      };
    }

    if (Array.isArray(staticModules)) {
      this.entrypointCache = new ModuleCache(staticModules);
    }

    const getModules =
      this.entrypointCache?.getModules ||
      (() => Promise.resolve<Record<string, unknown>>({}));

    this.memoryFS = new Volume();

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-webpack-plugin')]
    this.ctx = {
      getClassNameForKey,
      getModules,
      defaultLoaderOptions: loaderOptions,
      memoryFS: this.memoryFS,
    };
  }

  public static loader = customRequire.resolve(
    '@jsxstyle/webpack-plugin/loader'
  );

  private ctx: PluginContext;
  private memoryFS = new Volume();
  private entrypointCache?: ModuleCache;

  private nmlPlugin = (loaderContext: any): void => {
    loaderContext[Symbol.for('jsxstyle-webpack-plugin')] = this.ctx;
  };

  /** conditionally set based on whether or not we have a `cacheFile` */
  private donePlugin: (() => void) | null = null;

  private makePlugin =
    (compiler: Compiler, moduleCache: ModuleCache) =>
    (compilation: Compilation): Promise<void> => {
      return new Promise((resolve, reject) => {
        const resultObject: Record<string, string> = {};

        const childCompiler = compilation.createChildCompiler(
          childCompilerName,
          {
            filename: '[name]',
            library: {
              type: 'commonjs2',
            },
            scriptType: 'text/javascript',
            iife: true,
          },
          [
            new compiler.webpack.node.NodeTargetPlugin(),
            new compiler.webpack.node.NodeTemplatePlugin(),
            new compiler.webpack.LoaderTargetPlugin('node'),
            new compiler.webpack.library.EnableLibraryPlugin('commonjs2'),
          ]
        );

        // these two options don't appear to be respected
        childCompiler.options.mode = 'production';
        childCompiler.options.devtool = false;

        childCompiler.context = compiler.context;
        childCompiler.options.output.library = { type: 'commonjs2' };

        for (const [modulePath, metadata] of Object.entries(
          moduleCache.entrypoints
        )) {
          new compiler.webpack.EntryPlugin(
            compiler.context,
            modulePath,
            metadata.key
          ).apply(childCompiler);
        }

        // delete all emitted chunks
        childCompiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
          compilation.hooks.processAssets.tap(
            {
              name: pluginName,
              stage:
                compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            },
            (assets) => {
              for (const [key, asset] of Object.entries(assets)) {
                resultObject[key] = asset.source().toString();
                compilation.deleteAsset(key);
              }
            }
          );
        });

        childCompiler.hooks.normalModuleFactory.tap(
          pluginName,
          (normalModuleFactory) => {
            normalModuleFactory.hooks.afterResolve.tap(
              pluginName,
              (resolveData) => {
                resolveData.createData.loaders =
                  resolveData.createData.loaders?.filter(
                    (loaderObj) =>
                      loaderObj.loader !== JsxstyleWebpackPlugin.loader
                  );
              }
            );
          }
        );

        childCompiler.hooks.beforeCompile.tap(pluginName, () => {
          moduleCache.reset();
        });

        childCompiler.runAsChild((err) => {
          if (err) {
            compilation.errors.push(err as any);
            moduleCache.reject(err);
            reject(err);
          } else {
            moduleCache.setModules(resultObject);
            resolve();
          }
        });
      });
    };

  public apply(compiler: Compiler): void {
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

    if (this.entrypointCache) {
      compiler.hooks.make.tapPromise(
        pluginName,
        this.makePlugin(compiler, this.entrypointCache)
      );
    }
  }
}
