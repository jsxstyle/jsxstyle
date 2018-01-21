'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const JsxstyleLoaderPlugin = require('jsxstyle-loader/plugin');

const appSrc = path.join(__dirname, 'src');

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: path.join(__dirname, './src/index.tsx'),
  output: {
    path: path.join(__dirname, 'build'),
    pathinfo: true,
    filename: 'bundle.js',
    chunkFilename: '[name].chunk.js',
    publicPath: '/',
    devtoolModuleFilenameTemplate: info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  },

  plugins: [
    new JsxstyleLoaderPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, '../react/template.html'),
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],

  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.js$/,
        loader: require.resolve('source-map-loader'),
        enforce: 'pre',
        include: appSrc,
      },
      {
        test: /\.(?:js|tsx?)/,
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
        ],
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.tsx?$/,
            include: appSrc,
            // loaders run from bottom to top!
            use: [
              require.resolve('jsxstyle-loader'),
              require.resolve('ts-loader'),
            ],
          },
          {
            test: /\.css$/,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                },
              },
            ],
          },
          {
            exclude: [/\.js$/, /\.html$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
};
