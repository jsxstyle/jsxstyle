'use strict';

const invariant = require('invariant');
const path = require('path');
const webpack = require('webpack');
// eslint-disable-next-line node/no-extraneous-require
const NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');

const jsxstyleKey = require('./utils/getKey')();
const resultLoader = require.resolve('./result-loader');

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
        // instead of `require`ing css in every module that uses jsxstyle,
        // combine all the requires into one CSS file and prepend it to `entry`.
        __experimental__combineCSS: false,
        // if the loader encounters a dash-cased element matching a default,
        // treat it like a lite component instead of an element.
        __experimental__extremelyLiteMode: false,
      },
      options
    );

    this.memoryFS = new webpack.MemoryOutputFileSystem();
    this.cacheObject = {};
    this.watching = false;

    // context object that gets passed to each loader.
    // available in each loader as this[require('./getKey')()]
    this.ctx = {
      cacheObject: this.cacheObject,
      memoryFS: this.memoryFS,
      fileList: new Set(),
      needAdditionalPass: true,
      compileCallback: null,
      aggregateFile: null,
      combineCSS: !!options.__experimental__combineCSS,
      extremelyLiteMode: options.__experimental__extremelyLiteMode,
    };
  }

  apply(compiler) {
    const memoryFS = this.memoryFS;

    compiler.plugin('watch-run', (compiler, callback) => {
      this.watching = true;
      callback();
    });

    compiler.plugin('environment', () => {
      if (this.ctx.combineCSS) {
        // TODO: figure out the webpack-y way of getting the current entrypoint
        let entry = compiler.options.entry;
        if (Array.isArray(entry)) {
          entry = compiler.options.entry[compiler.options.entry.length - 1];
        } else {
          invariant(
            typeof entry === 'string',
            'JsxstyleLoaderPlugin only supports array and string `entry` values for now.'
          );
        }

        const baseDir = path.dirname(entry);
        this.ctx.aggregateFile = path.join(baseDir, '_main.jsxstyle.css');
        memoryFS.mkdirpSync(baseDir);
        memoryFS.writeFileSync(this.ctx.aggregateFile, '/* placeholder */');

        compiler.options.entry = [].concat(
          resultLoader + '!' + this.ctx.aggregateFile,
          compiler.options.entry
        );
      }

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

    // emit only after the second pass
    compiler.plugin('should-emit', () => {
      return this.watching || this.ctx.needAdditionalPass;
    });

    compiler.plugin('compilation', compilation => {
      compilation.plugin('normal-module-loader', loaderContext => {
        loaderContext[jsxstyleKey] = this.ctx;
      });

      if (!this.ctx.combineCSS || compilation.compiler.isChild()) return;

      compilation.plugin('need-additional-pass', () => {
        if (this.ctx.needAdditionalPass) {
          this.ctx.needAdditionalPass = false;
          return true;
        }

        this.ctx.needAdditionalPass = true;
        this.ctx.fileList.clear();
      });
    });
  }
}

module.exports = JsxstyleWebpackPlugin;
