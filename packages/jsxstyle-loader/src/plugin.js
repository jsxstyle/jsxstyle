'use strict';

// eslint-disable-next-line node/no-extraneous-require
const NodeWatchFileSystem = require('webpack/lib/node/NodeWatchFileSystem');
const MemoryFileSystem = require('memory-fs');

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

function JsxstyleWebpackPlugin() {
  this._fsObj = {};
  this.memoryFS = new MemoryFileSystem(this._fsObj);
}

JsxstyleWebpackPlugin.prototype.apply = function(compiler) {
  compiler['__JSXSTYLE_LOADER_FS__'] = this.memoryFS;
  const memoryFS = this.memoryFS;

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
};

module.exports = JsxstyleWebpackPlugin;
