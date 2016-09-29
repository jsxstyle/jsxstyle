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
        loader: 'babel',
      },
      { test: /\.css$/, loader: ExtractTextPlugin.extract(
        'style-loader',
        'css-loader'
      )},

    ],
  },

  plugins: [new JsxstylePlugin(), new ExtractTextPlugin('bundle.css')],
};
