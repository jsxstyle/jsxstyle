import type { CacheObject, PluginContext, MemoryFS } from './types';
import { wrapFileSystem } from './utils/wrapFileSystem';
import { EntrypointCache } from './EntrypointCache';

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

class JsxstyleWebpackPlugin implements webpack.WebpackPluginInstance {
  constructor({ staticModules = [] }: JsxstyleWebpackPluginOptions = {}) {
    this.memoryFS = new Volume();

    // the default cache object. can be overridden on a per-loader instance basis with the `cacheFile` option.
    this.cacheObject = {
      [counterKey]: 0,
    };

    this.entrypointCache = new EntrypointCache(staticModules);

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-webpack-plugin')]
    this.ctx = {
      cacheFile: null,
      cacheObject: this.cacheObject,
      memoryFS: this.memoryFS,
      getModules: this.entrypointCache.getModules,
    };
  }

  public static loader = require.resolve('./loader');

  private cacheObject: CacheObject;
  private ctx: PluginContext;
  private memoryFS: MemoryFS;
  private entrypointCache: EntrypointCache;

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

  private donePlugin = (): void => {
    if (this.ctx.cacheFile) {
      // write contents of cache object as a newline-separated list of CSS strings
      const cacheString =
        Object.keys(this.ctx.cacheObject).filter(Boolean).join('\n') + '\n';
      fs.writeFileSync(this.ctx.cacheFile, cacheString, 'utf8');
    }
  };

  private makePlugin = (compiler: Compiler) => (
    compilation: Compilation,
    callback: (...args: any[]) => void
  ): void => {
    const childCompiler: Compiler = (compilation as any).createChildCompiler(
      childCompilerName,
      {
        filename: '[name]',
        libraryTarget: 'commonjs2',
        library: {
          type: 'commonjs2',
        },
        scriptType: 'text/javascript',
        iife: false,
      },
      [
        new NodeTargetPlugin(),
        new NodeTemplatePlugin(),
        new LoaderTargetPlugin('node'),
        new LibraryTemplatePlugin(undefined, 'commonjs2'),
      ]
    );

    childCompiler.context = compiler.context;

    Object.entries(this.entrypointCache.entrypoints).forEach(
      ([modulePath, metadata]) => {
        childCompiler.apply(
          new SingleEntryPlugin(compiler.context, modulePath, metadata.key)
        );
      }
    );

    // delete all emitted chunks
    childCompiler.hooks.afterCompile.tap(pluginName, (compilation) => {
      this.entrypointCache.setModules({ ...compilation.assets });
      for (const key in compilation.assets) {
        delete compilation.assets[key];
      }
    });

    (childCompiler as any).runAsChild(
      (err: any, entries: any, childCompilation: Compilation) => {
        if (!err) {
          callback();
          return;
        }

        compilation.errors.push(err);
        this.entrypointCache.reject(err);
        callback(err);
      }
    );
  };

  private beforeCompilePlugin = (): void => {
    this.entrypointCache.reset();
  };

  public apply(compiler: Compiler): void {
    const environmentPlugin = (): void => {
      const wrappedFS = wrapFileSystem(compiler.inputFileSystem, this.memoryFS);
      compiler.inputFileSystem = wrappedFS;
      (compiler as any).watchFileSystem = new NodeWatchFileSystem(wrappedFS);
    };

    if (compiler.hooks) {
      // webpack 4+
      compiler.hooks.beforeCompile.tap(pluginName, this.beforeCompilePlugin);
      compiler.hooks.environment.tap(pluginName, environmentPlugin);
      compiler.hooks.compilation.tap(pluginName, this.compilationPlugin);
      compiler.hooks.done.tap(pluginName, this.donePlugin);
      compiler.hooks.make.tapAsync(pluginName, this.makePlugin(compiler));
    } else {
      // webpack 1-3
      compiler.plugin('environment', environmentPlugin);
      compiler.plugin('compilation', this.compilationPlugin);
      compiler.plugin('done', this.donePlugin);
    }
  }
}

export = JsxstyleWebpackPlugin;
