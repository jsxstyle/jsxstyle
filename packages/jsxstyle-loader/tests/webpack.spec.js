'use strict';

const path = require('path');
const webpackConfig = require('./webpack/webpack.config');
const webpack = require('webpack');

// TODO: evaluate webpack bundle
it('builds without issue', function() {
  const config = webpackConfig({multipleEntrypoints: true}, {});
  const compiler = webpack(config);
  const fs = new webpack.MemoryOutputFileSystem();
  compiler.outputFileSystem = fs;

  expect.assertions(1);
  const compilePromise = new Promise((resolve, reject) => {
    compiler.run(err => {
      if (err) reject(err);
      resolve({
        red: fs.readFileSync(
          path.join(config.output.path, 'bundle-red.css'),
          'utf8'
        ),
        blue: fs.readFileSync(
          path.join(config.output.path, 'bundle-blue.css'),
          'utf8'
        ),
      });
    });
  });

  return expect(compilePromise).resolves.toEqual({
    red: `/* ./tests/webpack/test-app/RedApp.js:8 (Block) */
._x0 {
  color: red;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 18px;
  line-height: 22px;
}
`,
    blue: `/* ./tests/webpack/test-app/BlueApp.js:8 (Block) */
._x1 {
  color: blue;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 18px;
  line-height: 22px;
}
`,
  });
});
