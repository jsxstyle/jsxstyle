const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');
const JsxstylePlugin = require('.../../..');

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
    new JsxstylePlugin(),
    new MiniCssExtractPlugin({
      chunkFilename: '[id].css',
      filename: 'bundle-[name].css',
    }),
  ],

  resolve: {
    alias: {
      jsxstyle: require.resolve('../../../../jsxstyle'),
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
          {
            loader: JsxstylePlugin.loader,
            options: {
              classNameFormat: 'hash',
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
};
