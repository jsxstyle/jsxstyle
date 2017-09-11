const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env = {}, options = {}) => ({
  entry: require.resolve('./entry'),
  output: {
    path: __dirname + '/build',
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      template: __dirname + '/template.html',
      inject: false,
    }),
    !options.hot && new ExtractTextPlugin('bundle.css'),
  ].filter(f => f),
  resolve: {
    alias: {
      jsxstyle: require.resolve('../'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [
            [
              'env',
              {
                targets: {
                  browsers: ['last 2 versions'],
                },
                modules: false,
              },
            ],
            'react',
          ],
          plugins: ['transform-object-rest-spread', 'transform-object-assign'],
        },
      },
      options.hot
        ? {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
          }
        : {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use: 'css-loader',
            }),
          },
    ],
  },
});
