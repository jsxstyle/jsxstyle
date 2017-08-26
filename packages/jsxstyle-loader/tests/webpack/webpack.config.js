'use strict';

const webpack = require('webpack');
const path = require('path');
const JsxstyleWebpackPlugin = require('../../src/plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

class ReactIndexPlugin {
  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      const statsObj = compilation.getStats().toJson();
      // this seems fragile
      const bundleFile = path.join(
        statsObj.publicPath,
        Array.isArray(statsObj.assetsByChunkName.main)
          ? statsObj.assetsByChunkName.main[0]
          : statsObj.assetsByChunkName.main
      );

      const indexFileContents = []
        .concat(
          '<!doctype html>',
          '<div id=".jsxstyle-demo"></div>',
          `<script src="${bundleFile}"></script>`
        )
        .join('\n');

      compilation.assets['index.html'] = {
        source: () => indexFileContents,
        size: () => indexFileContents.length,
      };

      callback();
    });
  }
}

module.exports = function(env, options) {
  return {
    entry: [require.resolve('./test-app/entrypoint')],
    output: {
      path: path.join(__dirname, 'build'),
      publicPath: '/',
      filename: 'bundle.[hash].js',
    },
    plugins: [
      new webpack.NamedModulesPlugin(),
      new JsxstyleWebpackPlugin(),
      !options.hot && new ExtractTextPlugin('bundle.css'),
      options.hot && new ReactIndexPlugin(),
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                presets: [
                  [require.resolve('babel-preset-env'), { modules: false }],
                  require.resolve('babel-preset-react'),
                ],
              },
            },
            {
              loader: require.resolve('../../'),
            },
          ],
        },
        {
          test: /\.css$/,
          use: options.hot
            ? ['style-loader', 'css-loader']
            : ExtractTextPlugin.extract({
                fallback: require.resolve('style-loader'),
                use: require.resolve('css-loader'),
              }),
        },
      ],
    },
  };
};
