'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: [
    require.resolve('webpack-dev-server/client') + '?http://localhost:3069/',
    require.resolve('webpack/hot/only-dev-server'),
    'react-hot-loader/patch',
    require.resolve('./main'),
  ],
  output: {
    path: null,
    filename: 'bundle.js',
  },
  resolve: {
    alias: {
      jsxstyle: require.resolve('../'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'template.html',
      inject: false,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: require.resolve('babel-loader'),
      },
      {
        test: /\.css$/,
        loader: 'style-loader',
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
      },
    ],
  },
};
