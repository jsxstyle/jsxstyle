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
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'ecmascript', jsx: true },
                transform: { react: { runtime: 'automatic' } },
              },
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'typescript', tsx: true },
                transform: { react: { runtime: 'automatic' } },
              },
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
