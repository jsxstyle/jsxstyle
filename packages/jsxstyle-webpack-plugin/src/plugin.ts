import type { CacheObject, PluginContext, MemoryFS } from './types';
import { wrapFileSystem } from './utils/wrapFileSystem';

import fs = require('fs');
import path = require('path');
import webpack = require('webpack');
import NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
import NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
import SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
import LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
import { Volume } from 'memfs';

import Compiler = webpack.Compiler;
import Compilation = webpack.compilation.Compilation;
import { getExportsFromModuleSource } from './utils/createModule';

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

    this.childCompilerEntrypoints = staticModules;

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-webpack-plugin')]
    this.ctx = {
      cacheFile: null,
      cacheObject: this.cacheObject,
      memoryFS: this.memoryFS,
      modulesByAbsolutePath: this.modulesByAbsolutePath,
    };
  }

  public static loader = require.resolve('./loader');

  private pluginName = 'JsxstylePlugin';

  private cacheObject: CacheObject;
  private ctx: PluginContext;
  private memoryFS: MemoryFS;
  private modulesByAbsolutePath: Record<string, unknown> = {};
  private childCompilerEntrypoints: string[] = [];

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

  private makePlugin = (compiler: Compiler) => (
    compilation: Compilation,
    callback: () => void
  ): void => {
    const outputOptions = compiler.options;

    const childCompiler = (compilation as any).createChildCompiler(
      this.pluginName + ' compiled modules',
      {
        output: {
          libraryTarget: 'commonjs2',
          library: {
            type: 'commonjs2',
          },
          filename: '[name].js',
        },
      }
    );

    childCompiler.context = compiler.context;
    childCompiler.options = Object.assign({}, outputOptions);

    const moduleObj = this.childCompilerEntrypoints.reduce<
      Record<string, string>
    >((prev, moduleName, index) => {
      const key = 'JSXSTYLE_MODULE_' + index;
      prev[key] = moduleName;
      return prev;
    }, {});

    childCompiler.options.entry = Object.entries(moduleObj).reduce<
      Record<string, string>
    >((prev, [moduleName, modulePath]) => {
      prev[moduleName] = modulePath;
      childCompiler.apply(
        new SingleEntryPlugin(compiler.context, modulePath, moduleName)
      );
      childCompiler.apply(new LibraryTemplatePlugin(undefined, 'commonjs2'));
      childCompiler.apply(new NodeTargetPlugin());
      return prev;
    }, {});

    childCompiler.options.target = 'node';

    childCompiler.options.output = {
      ...childCompiler.options.output,
      libraryTarget: 'commonjs2',
      library: {
        type: 'commonjs2',
      },
      filename: '[name].js',
    };

    childCompiler.options.output.filename = '[name].js';

    childCompiler.runAsChild(
      (err: any, entries: any, childCompilation: Compilation) => {
        if (!err) {
          Object.entries(childCompilation.assets).forEach(([key, asset]) => {
            const basename = path.basename(key, '.js');
            if (!moduleObj.hasOwnProperty(basename)) {
              console.log('Unexpected asset name: `%s`', key);
              return;
            }

            const assetSource: string = (asset as any).source().toString();

            const modulePath = moduleObj[basename];
            const assetModule = getExportsFromModuleSource(
              modulePath,
              assetSource
            );

            this.modulesByAbsolutePath[basename] = assetModule;
          });
        } else {
          compilation.errors.push(err);
        }
        callback();
      }
    );
  };

  public apply(compiler: Compiler) {
    const environmentPlugin = (): void => {
      const wrappedFS = wrapFileSystem(compiler.inputFileSystem, this.memoryFS);
      compiler.inputFileSystem = wrappedFS;
      (compiler as any).watchFileSystem = new NodeWatchFileSystem(wrappedFS);
    };

    if (compiler.hooks) {
      // webpack 4+
      compiler.hooks.environment.tap(this.pluginName, environmentPlugin);
      compiler.hooks.compilation.tap(this.pluginName, this.compilationPlugin);
      compiler.hooks.done.tap(this.pluginName, this.donePlugin);
      compiler.hooks.make.tapAsync(this.pluginName, this.makePlugin(compiler));
    } else {
      // webpack 1-3
      compiler.plugin('environment', environmentPlugin);
      compiler.plugin('compilation', this.compilationPlugin);
      compiler.plugin('done', this.donePlugin);
    }
  }
}

export = JsxstyleWebpackPlugin;
