// @ts-check

import { JsxstyleWebpackPlugin } from '@jsxstyle/webpack-plugin';
import { ReactIndexPlugin } from '../ReactIndexPlugin';

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'production',
  entry: require.resolve('./entry'),

  output: {
    path: __dirname + '/build',
    filename: 'bundle.js',
  },

  target: 'web',

  plugins: [
    new ReactIndexPlugin(),
    new JsxstyleWebpackPlugin({
      cssMode: 'multipleInlineImports',
      staticModules: [require.resolve('./LayoutConstants')],
    }),
  ],

  resolve: {
    alias: {
      '@jsxstyle/react': require.resolve('@jsxstyle/react'),
    },
  },

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
