'use strict';

const path = require('path');

class ReactIndexPlugin {
  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      const statsObj = compilation.getStats().toJson();
      // this seems fragile
      const bundleFile = path.join(
        statsObj.publicPath,
        Array.isArray(statsObj.assetsByChunkName.main)
          ? statsObj.assetsByChunkName.main[0]
          : statsObj.assetsByChunkName.main
      );

      const indexFileContents = []
        .concat(
          '<!doctype html>',
          '<div id=".jsxstyle-demo"></div>',
          `<script src="${bundleFile}"></script>`
        )
        .join('\n');

      compilation.assets['index.html'] = {
        source: () => indexFileContents,
        size: () => indexFileContents.length,
      };

      callback();
    });
  }
}

module.exports = ReactIndexPlugin;
