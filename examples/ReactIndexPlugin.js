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
    compiler.hooks.make.tap('ReactIndexPlugin', (compilation) => {
      compilation.hooks.processAssets.tap('ReactIndexPlugin', () => {
        compilation.emitAsset(fileName, source);
      });
    });
  }
}

module.exports = ReactIndexPlugin;
