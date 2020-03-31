import { CacheObject, PluginContext } from './types';

import fs = require('fs');
import webpack = require('webpack');
import MemoryFileSystem = require('webpack/lib/MemoryOutputFileSystem');
import NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
import { wrapFileSystem } from './utils/wrapFileSystem';

import Compiler = webpack.Compiler;
import Compilation = webpack.compilation.Compilation;

const counterKey = Symbol.for('counter');

// TODO submit PR to DefinitelyTyped
declare module 'webpack' {
  interface Compiler {
    watchFileSystem: import('webpack/lib/node/NodeWatchFileSystem');
  }
}

class JsxstyleWebpackPlugin implements webpack.Plugin {
  constructor() {
    this.memoryFS = new MemoryFileSystem();

    // the default cache object. can be overridden on a per-loader instance basis with the `cacheFile` option.
    this.cacheObject = {
      [counterKey]: 0,
    };

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-webpack-plugin')]
    this.ctx = {
      cacheFile: null,
      cacheObject: this.cacheObject,
      fileList: new Set(),
      memoryFS: this.memoryFS,
    };
  }

  public static loader = require.resolve('./loader');

  private pluginName = 'JsxstylePlugin';
  private memoryFS: MemoryFileSystem;
  private cacheObject: CacheObject;
  private ctx: PluginContext;

  private nmlPlugin = (loaderContext: any): void => {
    loaderContext[Symbol.for('jsxstyle-webpack-plugin')] = this.ctx;
  };

  private compilationPlugin = (compilation: Compilation): void => {
    if (compilation.hooks) {
      compilation.hooks.normalModuleLoader.tap(this.pluginName, this.nmlPlugin);
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

  public apply(compiler: Compiler) {
    const environmentPlugin = (): void => {
      const wrappedFS = wrapFileSystem(compiler.inputFileSystem, this.memoryFS);
      compiler.inputFileSystem = wrappedFS;
      compiler.watchFileSystem = new NodeWatchFileSystem(wrappedFS);
    };

    if (compiler.hooks) {
      // webpack 4+
      compiler.hooks.environment.tap(this.pluginName, environmentPlugin);
      compiler.hooks.compilation.tap(this.pluginName, this.compilationPlugin);
      compiler.hooks.done.tap(this.pluginName, this.donePlugin);
    } else {
      // webpack 1-3
      compiler.plugin('environment', environmentPlugin);
      compiler.plugin('compilation', this.compilationPlugin);
      compiler.plugin('done', this.donePlugin);
    }
  }
}

export = JsxstyleWebpackPlugin;
