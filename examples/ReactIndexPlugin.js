'use strict';

function emitPlugin(compilation, callback) {
  const indexFileContents = `<!doctype html>
<title>jsxstyle demo</title>
<div id=".jsxstyle-demo"></div>
<script src="/bundle.js"></script>
`;

  const fileName = 'index.html';

  const source = {
    source: () => indexFileContents,
    size: () => indexFileContents.length,
  };

  if (compilation.emitAsset) {
    compilation.emitAsset(fileName, source);
  } else {
    compilation.assets[fileName] = source;
  }

  if (callback) {
    callback();
  }
}

class ReactIndexPlugin {
  apply(compiler) {
    if (compiler.hooks) {
      if (compiler.hooks.processAssets) {
        // webpack 5
        compiler.hooks.processAssets.tap('ReactIndexPlugin', emitPlugin);
      } else {
        // webpack 4
        compiler.hooks.emit.tap('ReactIndexPlugin', emitPlugin);
      }
    } else {
      // webpack 1-3
      compiler.plugin('emit', emitPlugin);
    }
  }
}

module.exports = ReactIndexPlugin;
