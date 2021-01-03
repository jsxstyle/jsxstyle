const ReactIndexPlugin = require('../ReactIndexPlugin');

module.exports = {
  mode: 'production',
  entry: require.resolve('./entry'),
  output: {
    path: __dirname + '/build',
    filename: 'bundle.js',
  },
  plugins: [new ReactIndexPlugin()],
  resolve: {
    alias: {
      jsxstyle: require.resolve('jsxstyle'),
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
              '@babel/preset-env',
              {
                targets: {
                  browsers: ['last 2 versions'],
                },
                modules: false,
              },
            ],
            '@babel/preset-react',
          ],
          plugins: [
            require.resolve('@babel/plugin-proposal-object-rest-spread'),
            require.resolve('@babel/plugin-transform-object-assign'),
          ],
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
