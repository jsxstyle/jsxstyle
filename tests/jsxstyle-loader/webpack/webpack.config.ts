import JsxstyleWebpackPlugin = require('jsxstyle-loader/plugin');
import MiniCssExtractPlugin = require('mini-css-extract-plugin');
import path = require('path');
import webpack = require('webpack');

import ReactIndexPlugin = require('../../../misc/ReactIndexPlugin');

const config: webpack.Configuration = {
  entry: {
    red: require.resolve('./test-app/red-entrypoint'),
    blue: require.resolve('./test-app/blue-entrypoint'),
  },
  mode: 'development',
  output: {
    filename: 'bundle-[name].js',
    path: path.join(__dirname, 'build'),
    publicPath: '/',
  },
  performance: { hints: false },
  plugins: [
    new JsxstyleWebpackPlugin(),
    new MiniCssExtractPlugin({
      chunkFilename: '[id].css',
      filename: 'bundle-[name].css',
    }),
  ],
  resolve: {
    alias: {
      jsxstyle: require.resolve('jsxstyle'),
    },
  },
};

config.module = {
  rules: [
    {
      exclude: /node_modules/,
      test: /\.js$/,
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
            classNameFormat: 'hash',
            liteMode: 'react',
          },
        },
      ],
    },
    {
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader'],
    },
  ],
};

export = config;
