'use strict';

const webpack = require('webpack');
const fs = require('fs');
const NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');

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

class JsxstyleWebpackPlugin {
  constructor() {
    this.memoryFS = new webpack.MemoryOutputFileSystem();

    // the default cache object. can be overridden on a per-loader instance basis with the `cacheFile` option.
    this.cacheObject = {};

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-loader')]
    this.ctx = {
      cacheObject: this.cacheObject,
      cacheFile: null,
      memoryFS: this.memoryFS,
      fileList: new Set(),
      compileCallback: null,
    };
  }

  apply(compiler) {
    const memoryFS = this.memoryFS;

    compiler.plugin('environment', () => {
      compiler.inputFileSystem = new Proxy(compiler.inputFileSystem, {
        get: (target, key) => {
          const value = target[key];

          if (handledMethods.hasOwnProperty(key)) {
            return function(filePath, ...args) {
              if (filePath.endsWith('__jsxstyle.css')) {
                return memoryFS[key](filePath, ...args);
              }
              return value.call(this, filePath, ...args);
            };
          }

          return value;
        },
      });

      compiler.watchFileSystem = new NodeWatchFileSystem(
        compiler.inputFileSystem
      );
    });

    compiler.plugin('compilation', compilation => {
      compilation.plugin('normal-module-loader', loaderContext => {
        loaderContext[Symbol.for('jsxstyle-loader')] = this.ctx;
      });
    });

    compiler.plugin('done', () => {
      if (this.ctx.cacheFile) {
        // write contents of cache object as a newline-separated list of CSS strings
        const cacheString = Object.keys(this.ctx.cacheObject).join('\n') + '\n';
        fs.writeFileSync(this.ctx.cacheFile, cacheString, 'utf8');
      }
    });
  }
}

module.exports = JsxstyleWebpackPlugin;
