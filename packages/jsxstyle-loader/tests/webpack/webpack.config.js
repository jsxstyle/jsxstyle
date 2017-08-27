'use strict';

const webpack = require('webpack');
const path = require('path');
const JsxstyleWebpackPlugin = require('../../src/plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ReactIndexPlugin = require('./ReactIndexPlugin');

module.exports = function(env, options) {
  return {
    entry: {
      red: require.resolve('./test-app/red-entrypoint'),
      blue: require.resolve('./test-app/blue-entrypoint'),
    },
    output: {
      path: path.join(__dirname, 'build'),
      publicPath: '/',
      filename: 'bundle-[name].js',
    },
    plugins: [
      new webpack.NamedModulesPlugin(),
      new JsxstyleWebpackPlugin(),
      !options.hot && new ExtractTextPlugin('bundle-[name].css'),
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
