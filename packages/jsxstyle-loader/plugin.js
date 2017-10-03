'use strict';

const path = require('path');
const webpack = require('webpack');

const NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');

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

    // context object that gets passed to each loader.
    // available in each loader as this[require('./getKey')()]
    this.ctx = {
      cacheObject: this.cacheObject,
      memoryFS: this.memoryFS,
      fileList: new Set(),
      compileCallback: null,
      combineCSS: options.__experimental__combineCSS,
      extremelyLiteMode: options.__experimental__extremelyLiteMode,
    };
  }

  apply(compiler) {
    const memoryFS = this.memoryFS;

    if (this.ctx.combineCSS) {
      // TODO: one CSS file per entry
      compiler.plugin('entry-option', (context, entry) => {
        const getEntry = (item, name) => {
          const aggregateFile = path.join(context, name + '.jsxstyle.css');
          memoryFS.mkdirpSync(context);
          memoryFS.writeFileSync(aggregateFile, '/* placeholder */');

          return new MultiEntryPlugin(
            context,
            [resultLoader + '!' + aggregateFile].concat(item),
            name
          );
        };

        if (typeof entry === 'string' || Array.isArray(entry)) {
          compiler.apply(getEntry(entry, 'main'));
        } else if (typeof entry === 'object') {
          Object.keys(entry).forEach(name => {
            compiler.apply(getEntry(entry[name], name));
          });
        }

        return true;
      });
    }

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

    compiler.plugin('compilation', compilation => {
      compilation.plugin('normal-module-loader', loaderContext => {
        loaderContext[jsxstyleKey] = this.ctx;
      });
    });
  }
}

module.exports = JsxstyleWebpackPlugin;
