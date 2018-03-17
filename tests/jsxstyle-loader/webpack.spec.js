'use strict';

const path = require('path');
const webpackConfig = require('./webpack/webpack.config');
const webpack = require('webpack');

// one minute
jest.setTimeout(60000);

// TODO: evaluate webpack bundle
it('builds without issue', () => {
  const config = webpackConfig({ multipleEntrypoints: true });
  const compiler = webpack(config);
  const fs = new webpack.MemoryOutputFileSystem();
  compiler.outputFileSystem = fs;

  expect.assertions(2);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        return reject(err);
      }

      const info = stats.toJson();
      if (stats.hasErrors()) return reject(info.errors);
      if (stats.hasWarnings()) console.warn(info.warnings);

      const redCSS = fs.readFileSync(
        path.join(config.output.path, 'bundle-red.css'),
        'utf8'
      );
      const blueCSS = fs.readFileSync(
        path.join(config.output.path, 'bundle-blue.css'),
        'utf8'
      );

      expect(redCSS)
        .toEqual(`/* ./tests/jsxstyle-loader/webpack/test-app/RedApp.js:8 (Inline) */
._1ioutjs {
  color: red;
  display: inline;
}
/* ./tests/jsxstyle-loader/webpack/test-app/Shared.js:8 (Block) */
._1qb53c2 {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 18px;
  line-height: 22px;
}
`);
      expect(blueCSS)
        .toEqual(`/* ./tests/jsxstyle-loader/webpack/test-app/Shared.js:8 (Block) */
._1qb53c2 {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 18px;
  line-height: 22px;
}
/* ./tests/jsxstyle-loader/webpack/test-app/BlueApp.js:8 (Inline) */
._1qr3dx1 {
  color: blue;
  display: inline;
}
`);

      resolve();
    });
  });
});
