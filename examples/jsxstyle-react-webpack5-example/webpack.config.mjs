// @ts-check

import { createRequire } from 'node:module';
import path from 'node:path';
import { JsxstyleWebpackPlugin } from '@jsxstyle/webpack-plugin';
import { ReactIndexPlugin } from '../ReactIndexPlugin.mjs';

const customRequire = createRequire(import.meta.url);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/** @type {import('webpack').Configuration} */
export default {
  mode: 'production',
  entry: customRequire.resolve('./entry'),

  output: {
    path: __dirname + '/build',
    filename: 'bundle.js',
  },

  target: 'web',

  plugins: [
    new ReactIndexPlugin(),
    new JsxstyleWebpackPlugin({
      cssMode: 'multipleInlineImports',
      staticModules: [customRequire.resolve('./LayoutConstants')],
    }),
  ],

  stats: {
    // log information from child compilers as well
    children: true,
  },

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
          JsxstyleWebpackPlugin.loader,
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: { injectType: 'singletonStyleTag' },
          },
          'css-loader',
        ],
      },
    ],
  },
};
