import type { CacheObject, PluginContext } from './types';
import { wrapFileSystem } from './utils/wrapFileSystem';
import { ModuleCache } from './utils/ModuleCache';

import fs = require('fs');
import webpack = require('webpack');
import { Volume } from 'memfs';
import { createClassNameGetter } from 'jsxstyle/utils';

import LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
import LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin');
import NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
import NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
import NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
import SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

import Compiler = webpack.Compiler;
import Compilation = webpack.compilation.Compilation;
import { pluginName, childCompilerName } from './constants';
import type { UserConfigurableOptions } from './utils/ast/extractStyles';

interface JsxstyleWebpackPluginOptions extends UserConfigurableOptions {
  /** An array of absolute paths to modules that should be compiled by webpack */
  staticModules?: string[];

  /** If set to `'hash``, use content-based hashes to generate classNames */
  classNameFormat?: 'hash';

  /**
   * An absolute path to a file that will be used to store jsxstyle class name cache information between builds.
   *
   * If `cacheFile` is set, the file will be created if it does not exist and will be overwritten every time `jsxstyle-webpack-plugin` runs.
   */
  cacheFile?: string;
}

const filterOutJsxstyleLoader = (loaderObj: any) =>
  loaderObj.loader !== JsxstyleWebpackPlugin.loader;

class JsxstyleWebpackPlugin implements webpack.WebpackPluginInstance {
  constructor({
    cacheFile,
    classNameFormat,
    staticModules,
    ...loaderOptions
  }: JsxstyleWebpackPluginOptions = {}) {
    const cacheObject: CacheObject = {};

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
        lines.forEach((line) => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            // add each line of CSS to the cache
            getClassNameForKey(trimmedLine);
          }
        });

        this.donePlugin = (): void => {
          // write contents of cache object as a newline-separated list of CSS strings
          const cacheString =
            Object.keys(cacheObject).filter(Boolean).join('\n') + '\n';
          fs.writeFileSync(cacheFile, cacheString, 'utf8');
        };
      } catch (err) {
        if (err.code === 'EISDIR') {
          throw new Error('cacheFile is a directory');
        }
      }
    }

    if (Array.isArray(staticModules)) {
      this.entrypointCache = new ModuleCache(staticModules);
    }

    const getModules =
      this.entrypointCache?.getModules || (() => Promise.resolve({}));

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

  public static loader = require.resolve('./loader');

  private ctx: PluginContext;
  private memoryFS = new Volume();
  private entrypointCache?: ModuleCache;

  private nmlPlugin = (loaderContext: any): void => {
    loaderContext[Symbol.for('jsxstyle-webpack-plugin')] = this.ctx;
  };

  private compilationPlugin = (compilation: Compilation): void => {
    if ((webpack as any)?.NormalModule?.getCompilationHooks) {
      const normalModuleLoader = (webpack as any).NormalModule.getCompilationHooks(
        compilation
      ).loader;
      normalModuleLoader.tap(pluginName, this.nmlPlugin);
    } else if (compilation.hooks) {
      compilation.hooks.normalModuleLoader.tap(pluginName, this.nmlPlugin);
    } else {
      compilation.plugin('normal-module-loader', this.nmlPlugin);
    }
  };

  /** conditionally set based on whether or not we have a `cacheFile` */
  private donePlugin: (() => void) | null = null;

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

      if (this.donePlugin) {
        compiler.hooks.done.tap(pluginName, this.donePlugin);
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
      if (this.donePlugin) {
        compiler.plugin('done', this.donePlugin);
      }
    }
  }
}

export = JsxstyleWebpackPlugin;
