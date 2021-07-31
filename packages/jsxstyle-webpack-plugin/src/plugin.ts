import type { CacheObject, PluginContext, MemoryFS } from './types';
import { wrapFileSystem } from './utils/wrapFileSystem';
import { ModuleCache } from './utils/ModuleCache';

import fs = require('fs');
import webpack = require('webpack');
import { Volume } from 'memfs';

import LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
import LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin');
import NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
import NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
import NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
import SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

import Compiler = webpack.Compiler;
import Compilation = webpack.compilation.Compilation;
import { pluginName, childCompilerName } from './constants';

const counterKey = Symbol.for('counter');

interface JsxstyleWebpackPluginOptions {
  /** An array of absolute paths to modules that should be compiled by webpack */
  staticModules?: string[];
}

const filterOutJsxstyleLoader = (loaderObj: any) =>
  loaderObj.loader !== JsxstyleWebpackPlugin.loader;

class JsxstyleWebpackPlugin implements webpack.WebpackPluginInstance {
  constructor({ staticModules }: JsxstyleWebpackPluginOptions = {}) {
    this.memoryFS = new Volume();

    // the default cache object. can be overridden on a per-loader instance basis with the `cacheFile` option.
    this.cacheObject = {
      [counterKey]: 0,
    };

    if (staticModules) {
      this.entrypointCache = new ModuleCache(staticModules);
    }

    const getModules =
      this.entrypointCache?.getModules || (() => Promise.resolve({}));

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-webpack-plugin')]
    this.ctx = {
      cacheFile: null,
      cacheObject: this.cacheObject,
      memoryFS: this.memoryFS,
      getModules,
    };
  }

  public static loader = require.resolve('./loader');

  private cacheObject: CacheObject;
  private ctx: PluginContext;
  private memoryFS: MemoryFS;
  private entrypointCache?: ModuleCache;

  private nmlPlugin = (loaderContext: any): void => {
    loaderContext[Symbol.for('jsxstyle-webpack-plugin')] = this.ctx;
  };

  private compilationPlugin = (compilation: Compilation): void => {
    if (compilation.hooks) {
      compilation.hooks.normalModuleLoader.tap(pluginName, this.nmlPlugin);
    } else {
      compilation.plugin('normal-module-loader', this.nmlPlugin);
    }
  };

  private donePlugin = (cacheFile: string) => (): void => {
    // write contents of cache object as a newline-separated list of CSS strings
    const cacheString =
      Object.keys(this.ctx.cacheObject).filter(Boolean).join('\n') + '\n';
    fs.writeFileSync(cacheFile, cacheString, 'utf8');
  };

  private makePlugin = (compiler: Compiler, moduleCache: ModuleCache) => (
    compilation: Compilation
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const resultObject: Record<string, string> = {};

      const childCompiler: Compiler = (compilation as any).createChildCompiler(
        childCompilerName,
        {
          filename: '[name]',
          libraryTarget: 'commonjs2',
          library: {
            type: 'commonjs2',
          },
          scriptType: 'text/javascript',
          iife: true,
        },
        [
          new NodeTargetPlugin(),
          new NodeTemplatePlugin(),
          new LoaderTargetPlugin('node'),
          new LibraryTemplatePlugin(undefined, 'commonjs2'),
        ]
      );

      childCompiler.context = compiler.context;

      Object.entries(moduleCache.entrypoints).forEach(
        ([modulePath, metadata]) => {
          new SingleEntryPlugin(
            compiler.context,
            modulePath,
            metadata.key
          ).apply(childCompiler);
        }
      );

      // delete all emitted chunks
      childCompiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
        // webpack 5
        if ('processAssets' in compilation.hooks) {
          (compilation.hooks as any).processAssets.tap(
            {
              name: pluginName,
              stage: (webpack as any).Compilation
                .PROCESS_ASSETS_STAGE_ADDITIONS,
            },
            (assets: Record<string, { source: () => string | Buffer }>) => {
              Object.keys(assets).forEach((key) => {
                resultObject[key] = assets[key].source().toString();
                (compilation as any).deleteAsset(key);
              });
            }
          );
        }

        // webpack 4
        else {
          childCompiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            Object.keys(compilation.assets).forEach((key) => {
              resultObject[key] = compilation.assets[key].source().toString();
              delete compilation.assets[key];
            });
          });
        }
      });

      childCompiler.hooks.normalModuleFactory.tap(
        pluginName,
        (normalModuleFactory) => {
          normalModuleFactory.hooks.afterResolve.tap(
            pluginName,
            (resolveData: any) => {
              if (Array.isArray(resolveData.loaders)) {
                resolveData.loaders = resolveData.loaders.filter(
                  filterOutJsxstyleLoader
                );
              } else if ('createData' in resolveData) {
                resolveData.createData.loaders = resolveData.createData.loaders.filter(
                  filterOutJsxstyleLoader
                );
              }
            }
          );
        }
      );

      childCompiler.hooks.beforeCompile.tap(pluginName, () => {
        moduleCache.reset();
      });

      (childCompiler as any).runAsChild(
        (err: any, entries: any[], childCompilation: Compilation) => {
          if (err) {
            compilation.errors.push(err);
            moduleCache.reject(err);
            reject(err);
          } else {
            moduleCache.setModules(resultObject);
            resolve();
          }
        }
      );
    });
  };

  public apply(compiler: Compiler): void {
    const environmentPlugin = (): void => {
      const wrappedFS = wrapFileSystem(compiler.inputFileSystem, this.memoryFS);
      compiler.inputFileSystem = wrappedFS;
      (compiler as any).watchFileSystem = new NodeWatchFileSystem(wrappedFS);
    };

    if (compiler.hooks) {
      // webpack 4+
      compiler.hooks.environment.tap(pluginName, environmentPlugin);
      compiler.hooks.compilation.tap(pluginName, this.compilationPlugin);

      if (this.ctx.cacheFile) {
        compiler.hooks.done.tap(
          pluginName,
          this.donePlugin(this.ctx.cacheFile)
        );
      }

      if (this.entrypointCache) {
        compiler.hooks.make.tapPromise(
          pluginName,
          this.makePlugin(compiler, this.entrypointCache)
        );
      }
    } else {
      // webpack 1-3
      compiler.plugin('environment', environmentPlugin);
      compiler.plugin('compilation', this.compilationPlugin);
      if (this.ctx.cacheFile) {
        compiler.plugin('done', this.donePlugin(this.ctx.cacheFile));
      }
    }
  }
}

export = JsxstyleWebpackPlugin;
