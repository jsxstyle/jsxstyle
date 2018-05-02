'use strict';

const path = require('path');

function emitPlugin(compilation, callback) {
  const statsObj = compilation.getStats().toJson();

  for (const entryName in statsObj.assetsByChunkName) {
    const bundleFile = path.join(
      statsObj.publicPath,
      Array.isArray(statsObj.assetsByChunkName[entryName])
        ? statsObj.assetsByChunkName[entryName][0]
        : statsObj.assetsByChunkName[entryName]
    );

    const indexFileContents = `<!doctype html>
<title>jsxstyle demo</title>
<div id=".jsxstyle-demo"></div>
<script src="${bundleFile}"></script>
`;

    const fileName = (entryName === 'main' ? 'index' : entryName) + '.html';

    compilation.assets[fileName] = {
      source: () => indexFileContents,
      size: () => indexFileContents.length,
    };
  }

  if (callback) {
    callback();
  }
}

class ReactIndexPlugin {
  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.emit.tap('ReactIndexPlugin', emitPlugin);
    } else {
      compiler.plugin('emit', emitPlugin);
    }
  }
}

module.exports = ReactIndexPlugin;
