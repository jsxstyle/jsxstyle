'use strict';

const webpack = require('webpack');
// eslint-disable-next-line node/no-extraneous-require
const NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');

const jsxstyleKey = require('./getKey')();

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
    this.fsObj = {};
    this.memoryFS = new webpack.MemoryOutputFileSystem(this.fsObj);
    this.cacheObject = {};
  }

  apply(compiler) {
    const memoryFS = this.memoryFS;

    compiler.plugin('compilation', compilation => {
      compilation.plugin('normal-module-loader', loaderContext => {
        loaderContext[jsxstyleKey] = {
          cacheObject: this.cacheObject,
          memoryFS,
        };
      });
    });

    compiler.plugin('environment', () => {
      compiler.inputFileSystem = new Proxy(compiler.inputFileSystem, {
        get: (target, key) => {
          const value = target[key];

          if (handledMethods.hasOwnProperty(key)) {
            return function(filePath, ...args) {
              if (filePath.endsWith('.jsxstyle.css')) {
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
  }
}

module.exports = JsxstyleWebpackPlugin;
