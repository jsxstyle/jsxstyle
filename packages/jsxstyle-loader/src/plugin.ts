import webpack = require('webpack');
import fs = require('fs');
import NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
import { CacheObject, LoaderContext } from './types';

const handledMethods = {
  // exists: true,
  // existsSync: true,
  mkdir: true,
  mkdirSync: true,
  mkdirp: true,
  mkdirpSync: true,
  readdir: true,
  readdirSync: true,
  readFile: true,
  readFileSync: true,
  // readlink: true,
  // readlinkSync: true,
  rmdir: true,
  rmdirSync: true,
  stat: true,
  statSync: true,
  unlink: true,
  unlinkSync: true,
  writeFile: true,
  writeFileSync: true,
};

const counterKey = Symbol.for('counter');

class JsxstyleWebpackPlugin implements webpack.Plugin {
  constructor() {
    this.memoryFS = new (webpack as any).MemoryOutputFileSystem();

    // the default cache object. can be overridden on a per-loader instance basis with the `cacheFile` option.
    this.cacheObject = {
      [counterKey]: 0,
    };

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-loader')]
    this.ctx = {
      cacheObject: this.cacheObject,
      cacheFile: null,
      memoryFS: this.memoryFS,
      fileList: new Set(),
    };
  }

  private memoryFS: any;
  private cacheObject: CacheObject;
  private ctx: LoaderContext;

  apply(compiler: webpack.Compiler) {
    const memoryFS = this.memoryFS;

    const plugin = 'JsxstyleLoaderPlugin';

    const environmentPlugin = (): void => {
      (compiler as any).inputFileSystem = new Proxy(
        (compiler as any).inputFileSystem,
        {
          get: (target, key) => {
            const value = target[key];

            if (handledMethods.hasOwnProperty(key)) {
              return function(this: any, filePath: string, ...args: string[]) {
                if (filePath.endsWith('__jsxstyle.css')) {
                  return memoryFS[key](filePath, ...args);
                }
                return value.call(this, filePath, ...args);
              };
            }

            return value;
          },
        }
      );

      (compiler as any).watchFileSystem = new NodeWatchFileSystem(
        (compiler as any).inputFileSystem
      );
    };

    const compilationPlugin = (
      compilation: webpack.compilation.Compilation
    ): void => {
      const nmlPlugin = loaderContext => {
        loaderContext[Symbol.for('jsxstyle-loader')] = this.ctx;
      };

      if (compilation.hooks) {
        compilation.hooks.normalModuleLoader.tap(plugin, nmlPlugin);
      } else {
        compilation.plugin('normal-module-loader', nmlPlugin);
      }
    };

    const donePlugin = (): void => {
      if (this.ctx.cacheFile) {
        // write contents of cache object as a newline-separated list of CSS strings
        const cacheString = Object.keys(this.ctx.cacheObject).join('\n') + '\n';
        fs.writeFileSync(this.ctx.cacheFile, cacheString, 'utf8');
      }
    };

    if (compiler.hooks) {
      compiler.hooks.environment.tap(plugin, environmentPlugin);
      compiler.hooks.compilation.tap(plugin, compilationPlugin);
      compiler.hooks.done.tap(plugin, donePlugin);
    } else {
      compiler.plugin('environment', environmentPlugin);
      compiler.plugin('compilation', compilationPlugin);
      compiler.plugin('done', donePlugin);
    }
  }
}

export = JsxstyleWebpackPlugin;
