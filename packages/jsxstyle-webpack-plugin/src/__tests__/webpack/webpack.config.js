const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');
const JsxstyleWebpackPlugin = require('jsxstyle-webpack-plugin');

/** @type {webpack.Configuration} */
module.exports = {
  entry: {
    blue: require.resolve('./test-app/blue-entrypoint'),
    red: require.resolve('./test-app/red-entrypoint'),
  },

  mode: 'development',

  output: {
    filename: 'bundle-[name].js',
    path: path.join(__dirname, 'build'),
    publicPath: '/',
  },

  performance: { hints: false },

  plugins: [
    new JsxstyleWebpackPlugin({
      classNameFormat: 'hash',
    }),
    new MiniCssExtractPlugin({
      chunkFilename: '[id].css',
      filename: 'bundle-[name].css',
    }),
  ],

  resolve: {
    alias: {
      jsxstyle: path.dirname(require.resolve('jsxstyle/package.json')),
      'jsxstyle/utils': path.dirname(
        require.resolve('jsxstyle/utils/package.json')
      ),
    },
  },

  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.js$/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: false,
              presets: [
                [require.resolve('@babel/preset-env'), { modules: false }],
                require.resolve('@babel/preset-react'),
              ],
            },
          },
          JsxstyleWebpackPlugin.loader,
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
};
