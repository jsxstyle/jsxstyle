'use strict';

const path = require('path');
const webpackConfig = require('./webpack/webpack.config');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');

// TODO: evaluate webpack bundle
it('builds without issue', function() {
  const config = webpackConfig(null, {});
  const compiler = webpack(config);
  const fs = new MemoryFS();
  compiler.outputFileSystem = fs;

  expect.assertions(1);
  const compilePromise = new Promise((resolve, reject) => {
    compiler.run(err => {
      if (err) reject(err);
      resolve(
        fs.readFileSync(path.join(config.output.path, 'bundle.css'), 'utf8')
      );
    });
  });

  return expect(compilePromise).resolves
    .toEqual(`/* ./tests/webpack/test-app/App.js:8 (Block) */
._x0 {
  color: red;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 18px;
  line-height: 22px;
}
`);
});
