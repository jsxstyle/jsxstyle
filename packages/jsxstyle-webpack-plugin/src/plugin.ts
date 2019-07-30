import { CacheObject, PluginContext } from './types';

import fs = require('fs');
import webpack = require('webpack');
import MemoryFileSystem = require('webpack/lib/MemoryOutputFileSystem');
import NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
import RuleSet = require('webpack/lib/RuleSet');
import SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
import { wrapFileSystem } from './utils/wrapFileSystem';

import Compiler = webpack.Compiler;
import Compilation = webpack.compilation.Compilation;

const counterKey = Symbol.for('counter');

// TODO submit PR to DefinitelyTyped
declare module 'webpack' {
  interface Compiler {
    watchFileSystem: import('webpack/lib/node/NodeWatchFileSystem');
    options: webpack.Configuration;
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
      compiledWhitelistedModules: {},
      fileList: new Set(),
      memoryFS: this.memoryFS,
    };
  }

  public static loader = require.resolve('./loader');

  private pluginName = 'JsxstylePlugin';
  private memoryFS: MemoryFileSystem;
  private cacheObject: CacheObject;
  private ctx: PluginContext;
  private whitelistedModules: string[] = [];

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
      const cacheString = Object.keys(this.ctx.cacheObject).join('\n') + '\n';
      fs.writeFileSync(this.ctx.cacheFile, cacheString, 'utf8');
    }
  };

  // do not output modules in whitelistedModules to disk
  private cleanPlugin = (compilation, callback): void => {
    this.whitelistedModules.forEach(mod => {
      delete compilation.assets[mod];
    });
    callback();
  };

  public apply(compiler: Compiler) {
    const environmentPlugin = (): void => {
      const wrappedFS = wrapFileSystem(compiler.inputFileSystem, this.memoryFS);
      compiler.inputFileSystem = wrappedFS;
      compiler.watchFileSystem = new NodeWatchFileSystem(wrappedFS);
    };

    const compileWhitelistedModulesPlugin = (compilation, callback): void => {
      const { rules } = new RuleSet(
        (compiler.options.module && compiler.options.module.rules) || []
      );
      for (const rule of rules) {
        for (const use of rule.use) {
          if (use.loader.includes('jsxstyle-webpack-plugin')) {
            this.whitelistedModules = use.options.whitelistedModules;
            break;
          }
        }
      }
      const childCompiler = compilation.createChildCompiler(this.pluginName, {
        ...compiler.options.output,
        filename: '[name]', // do not apply hash
      });
      childCompiler.context = compiler.context;
      this.whitelistedModules.forEach(entry => {
        new SingleEntryPlugin(childCompiler.context, entry, entry).apply(
          childCompiler
        );
      });
      childCompiler.runAsChild((err, entries, childCompilation) => {
        if (!err) {
          this.whitelistedModules.forEach(mod => {
            this.ctx.compiledWhitelistedModules[mod] = childCompilation.assets[
              mod
            ].source();
          });
          callback();
        } else {
          callback(err);
        }
      });
    };

    if (compiler.hooks) {
      // webpack 4+
      compiler.hooks.environment.tap(this.pluginName, environmentPlugin);
      compiler.hooks.make.tapAsync(
        this.pluginName,
        compileWhitelistedModulesPlugin
      );
      compiler.hooks.compilation.tap(this.pluginName, this.compilationPlugin);
      compiler.hooks.emit.tapAsync(this.pluginName, this.cleanPlugin);
      compiler.hooks.done.tap(this.pluginName, this.donePlugin);
    } else {
      // TODO compile whitelistedModules for webpack 1-3
      // webpack 1-3
      compiler.plugin('environment', environmentPlugin);
      compiler.plugin('compilation', this.compilationPlugin);
      compiler.plugin('done', this.donePlugin);
    }
  }
}

export = JsxstyleWebpackPlugin;
