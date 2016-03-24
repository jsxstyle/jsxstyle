var path = require('path');

module.exports = {
  entry: './main',
  output: {
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      //{test: /\.js$/, loader: 'jsx-loader?harmony!' + path.join(__dirname, '..', 'lib', 'webpackLoader.js') + '?LayoutConstants=' + path.join(__dirname, 'LayoutConstants.js')},
      {test: /\.js$/, loader: 'jsx-loader?harmony'},
    ],
  },
};
