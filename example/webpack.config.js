module.exports = {
  entry: './main',
  output: {
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        query: {
          presets: ['react'],
        },
      },
    ],
  },
};
