'use strict';

const webpack = require('webpack');
const path = require('path');
const JsxstyleWebpackPlugin = require('../../plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ReactIndexPlugin = require('./ReactIndexPlugin');

function progressHandler(percentage, msg, ...args) {
  if (percentage === 0 || percentage === 1) return;
  process.stderr.write(
    [('   ' + Math.round(percentage * 100)).slice(-3) + '%', msg]
      .concat(
        args
          .filter(m => m != null)
          .map(m => m + '')
          .map(m => (m.length > 40 ? `...${m.substr(m.length - 37)}` : m))
      )
      .join(' ') + '\n'
  );
}

module.exports = function(env = {}, options = {}) {
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
      env.experimental && new webpack.ProgressPlugin(progressHandler),
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
              options: {
                liteMode: 'react',
              },
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
