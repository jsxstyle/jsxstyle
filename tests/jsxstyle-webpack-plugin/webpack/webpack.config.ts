import MiniCssExtractPlugin = require('mini-css-extract-plugin');
import path = require('path');
import webpack = require('webpack');
import JsxstylePlugin = require('../../../packages/jsxstyle-webpack-plugin');

const config: webpack.Configuration = {
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
      jsxstyle: require.resolve('../../../packages/jsxstyle'),
    },
  },
};

config.module = {
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
              [require.resolve('babel-preset-env'), { modules: false }],
              require.resolve('babel-preset-react'),
            ],
          },
        },
        {
          loader: JsxstylePlugin.loader,
          options: {
            classNameFormat: 'hash',
            liteMode: 'react',
          },
        },
      ],
    },
    {
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader'],
    },
  ],
};

export = config;
