import path = require('path');
import webpack = require('webpack');

const MemoryFS: any = require('webpack/lib/MemoryOutputFileSystem');
const webpackConfig: webpack.Configuration = require('./webpack/webpack.config');

// one minute
jest.setTimeout(60000);

// TODO: evaluate webpack bundle
it('builds without issue', () => {
  const compiler = webpack(webpackConfig);
  const fs = new MemoryFS();
  compiler.outputFileSystem = fs;

  expect.assertions(4);
  return new Promise<void>((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if ((err as any).details) {
          console.error((err as any).details);
        }
        return reject(err);
      }

      const info = stats.toJson();
      if (stats.hasErrors()) {
        return reject(info.errors);
      }
      if (stats.hasWarnings()) {
        console.warn(info.warnings);
      }

      const outputPath = webpackConfig.output?.path || '';

      const redCSS = fs.readFileSync(
        path.join(outputPath, 'bundle-red.css'),
        'utf8'
      );
      const blueCSS = fs.readFileSync(
        path.join(outputPath, 'bundle-blue.css'),
        'utf8'
      );

      const sharedStyles = `
/* ./packages/jsxstyle-webpack-plugin/src/__tests__/webpack/test-app/Shared.js:8 (Block) */
._1qb53c2 {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 18px;
  line-height: 22px;
}
      `.trim();

      expect(redCSS).toContain(
        `
/* ./packages/jsxstyle-webpack-plugin/src/__tests__/webpack/test-app/RedApp.js:8 (Inline) */
._1ioutjs {
  color: red;
  display: inline;
}
`.trim()
      );

      expect(blueCSS).toContain(
        `
/* ./packages/jsxstyle-webpack-plugin/src/__tests__/webpack/test-app/BlueApp.js:8 (Inline) */
._1qr3dx1 {
  color: blue;
  display: inline;
}
`.trim()
      );

      expect(redCSS).toContain(sharedStyles);
      expect(blueCSS).toContain(sharedStyles);

      resolve();
    });
  });
});
