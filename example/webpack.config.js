var ExtractTextPlugin = require('extract-text-webpack-plugin');
var JsxstylePlugin = require('../lib/JsxstylePlugin');

module.exports = {
  entry: './main',
  output: {
    path: __dirname + '/build',
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
      },
      {
        test: /\.js$/,
        loader: require.resolve('../lib/webpackLoader'),
        query: {
          LayoutConstants: require.resolve('./LayoutConstants'),
        },
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader'),
      },

    ],
  },
  plugins: [
    new JsxstylePlugin(),
    new ExtractTextPlugin('bundle.css'),
  ],
};
