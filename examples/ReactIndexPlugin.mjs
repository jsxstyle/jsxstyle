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

export class ReactIndexPlugin {
  apply(
    /** @type {any} */
    compiler
  ) {
    compiler.hooks.make.tap('ReactIndexPlugin', (compilation) => {
      compilation.hooks.processAssets.tap('ReactIndexPlugin', () => {
        compilation.emitAsset(fileName, source);
      });
    });
  }
}
