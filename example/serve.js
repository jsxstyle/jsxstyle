#!/usr/bin/env node

const invariant = require('invariant');
const temp = require('temp');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const hotConfig = require('./webpack.config.hot');

const WDS_PORT = 3069;
const WDS_URL = `http://localhost:${WDS_PORT}`;

temp.track();
temp.mkdir('_jsxstyle_', function(err, dirPath) {
  invariant(!err, err || 'nope');

  hotConfig.output.path = dirPath;

  const compiler = webpack(hotConfig);
  new WebpackDevServer(compiler, {
    public: WDS_URL,
    contentBase: dirPath,
    hot: true,
    historyApiFallback: true,
    stats: {
      colors: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }).listen(WDS_PORT, function(err) {
    invariant(!err, err || 'nope');
    // eslint-disable-next-line no-console
    console.log(`Serving ${dirPath} at ${WDS_URL}`);
  });
});
