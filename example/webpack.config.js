module.exports = {
  entry: './main',
  output: {
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel?presets=react!' + require.resolve('../lib/webpackLoader') + '?LayoutConstants=' + require.resolve('./LayoutConstants'),
      },
    ],
  },
};
