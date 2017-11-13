'use strict';

const webpack = require('webpack');
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
    this.cacheObject = {};

    // context object that gets passed to each loader.
    // available in each loader as this[Symbol.for('jsxstyle-loader')]
    this.ctx = {
      cacheObject: this.cacheObject,
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
  }
}

module.exports = JsxstyleWebpackPlugin;
