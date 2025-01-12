// @ts-check

import path from 'node:path';
import { JsxstyleWebpackPlugin } from '@jsxstyle/webpack-plugin';
import { ReactIndexPlugin } from '../ReactIndexPlugin.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const appSrc = path.join(__dirname, 'src');

/** @type {import('webpack').Configuration} */
export default {
  entry: path.join(__dirname, './src/index.tsx'),
  mode: 'development',
  target: 'web',
  output: {
    chunkFilename: '[name].chunk.js',
    filename: 'bundle.js',
    path: path.join(__dirname, 'build'),
    pathinfo: true,
    publicPath: '/',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  plugins: [new JsxstyleWebpackPlugin(), new ReactIndexPlugin()],

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        include: appSrc,
        use: [
          {
            loader: JsxstyleWebpackPlugin.loader,
            options: { cacheFile: __dirname + '/jsxstyle-cache' },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        type: 'asset/resource',
      },
    ],
  },
};
