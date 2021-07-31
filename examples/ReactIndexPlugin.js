'use strict';

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

const emitPlugin = (compilation, callback) => {
  compilation.assets[fileName] = source;

  if (callback) {
    callback();
  }
};

class ReactIndexPlugin {
  apply(
    /** @type {import('webpack').Compiler} */
    compiler
  ) {
    if (compiler.hooks) {
      compiler.hooks.make.tap('ReactIndexPlugin', (compilation) => {
        if ('processAssets' in compilation.hooks) {
          // webpack 5
          compilation.hooks.processAssets.tap('ReactIndexPlugin', () => {
            compilation.emitAsset(fileName, source);
          });
        } else {
          // webpack 4
          compiler.hooks.emit.tap('ReactIndexPlugin', emitPlugin);
        }
      });
    } else {
      // webpack 1-3
      compiler.plugin('emit', emitPlugin);
    }
  }
}

module.exports = ReactIndexPlugin;
