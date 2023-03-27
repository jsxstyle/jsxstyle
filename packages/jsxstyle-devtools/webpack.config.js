// @ts-check

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {
  context: path.join(__dirname, 'src'),
  target: 'web',
  mode: 'development',
  devtool: false,
  entry: {
    devtoolsPanel: './entrypoints/devtoolsPanel.tsx',
    devtools: './entrypoints/devtools.ts',
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'lib'),
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.mjs', '.cjs', '.json'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['devtools'],
      filename: 'devtools.html',
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['devtoolsPanel'],
      filename: 'devtoolsPanel.html',
      templateContent: `<!doctype html><head></head><div id=".jsxstyle-devtools"></div>`,
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(?:js|tsx?)$/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
};
