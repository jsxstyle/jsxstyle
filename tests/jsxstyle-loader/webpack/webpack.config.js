'use strict';

const webpack = require('webpack');
const path = require('path');
const JsxstyleWebpackPlugin = require('jsxstyle-loader/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactIndexPlugin = require('../../../misc/ReactIndexPlugin');

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
    mode: 'development',
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
      new JsxstyleWebpackPlugin(),
      !options.hot &&
        new MiniCssExtractPlugin({
          filename: options.cssFilename || 'bundle-[name].css',
          chunkFilename: '[id].css',
        }),
      options.hot && new ReactIndexPlugin(),
      env.experimental && new webpack.ProgressPlugin(progressHandler),
    ].filter(Boolean),
    resolve: {
      alias: {
        jsxstyle: require.resolve('jsxstyle'),
      },
    },
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
              loader: require.resolve('jsxstyle-loader'),
              options: {
                liteMode: 'react',
                classNameFormat: 'hash',
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: options.hot
            ? ['style-loader', 'css-loader']
            : [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
  };
};
