'use strict';

const path = require('path');

class ReactIndexPlugin {
  emitPlugin = (compilation, callback) => {
    const statsObj = compilation.getStats().toJson();

    for (const entryName in statsObj.assetsByChunkName) {
      const bundleFile = path.join(
        statsObj.publicPath,
        Array.isArray(statsObj.assetsByChunkName[entryName])
          ? statsObj.assetsByChunkName[entryName][0]
          : statsObj.assetsByChunkName[entryName]
      );

      const indexFileContents = []
        .concat(
          '<!doctype html>',
          '<title>jsxstyle demo</title>',
          '<div id=".jsxstyle-demo"></div>',
          `<script src="${bundleFile}"></script>`
        )
        .join('\n');

      const fileName = (entryName === 'main' ? 'index' : entryName) + '.html';

      compilation.assets[fileName] = {
        source: () => indexFileContents,
        size: () => indexFileContents.length,
      };
    }

    callback();
  };

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.emit.tap('ReactIndexPlugin', this.emitPlugin);
    } else {
      compiler.plugin('emit', this.emitPlugin);
    }
  }
}

module.exports = ReactIndexPlugin;
