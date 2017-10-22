'use strict';

const webpack = require('webpack');

const NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');

const jsxstyleKey = require('./utils/getKey')();

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
  constructor(options) {
    options = Object.assign(
      {
        // if the loader encounters a dash-cased element matching a default,
        // treat it like a lite component instead of an element.
        __experimental__liteMode: false,
      },
      options
    );

    this.memoryFS = new webpack.MemoryOutputFileSystem();
    this.cacheObject = {};

    // context object that gets passed to each loader.
    // available in each loader as this[require('./getKey')()]
    this.ctx = {
      cacheObject: this.cacheObject,
      memoryFS: this.memoryFS,
      fileList: new Set(),
      compileCallback: null,
      liteMode: options.__experimental__liteMode,
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
        loaderContext[jsxstyleKey] = this.ctx;
      });
    });
  }
}

module.exports = JsxstyleWebpackPlugin;
