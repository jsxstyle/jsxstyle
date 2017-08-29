'use strict';

const path = require('path');

class ReactIndexPlugin {
  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
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
    });
  }
}

module.exports = ReactIndexPlugin;
