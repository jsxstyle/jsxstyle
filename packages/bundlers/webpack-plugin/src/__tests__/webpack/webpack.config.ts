import path from 'node:path';
import { JsxstyleWebpackPlugin } from '@jsxstyle/webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration } from 'webpack';

export default {
  entry: {
    blue: require.resolve('./test-app/blue-entrypoint'),
    red: require.resolve('./test-app/red-entrypoint'),
  },

  mode: 'development',
  target: 'web',

  output: {
    filename: 'bundle-[name].js',
    path: path.join(__dirname, 'build'),
    publicPath: '/',
  },

  performance: { hints: false },

  plugins: [
    new JsxstyleWebpackPlugin({
      classNameStrategy: 'hash',
    }),
    new MiniCssExtractPlugin({
      chunkFilename: '[id].css',
      filename: 'bundle-[name].css',
    }),
  ],

  resolve: {
    fullySpecified: false,
    alias: {
      '@jsxstyle/react$': path.dirname(
        require.resolve('@jsxstyle/react/package.json')
      ),
    },
  },

  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.js$/,
        resolve: {
          fullySpecified: false,
        },
        use: [
          {
            loader: require.resolve('swc-loader'),
            options: {
              jsc: {
                parser: { syntax: 'ecmascript', jsx: true },
                transform: { react: { runtime: 'automatic' } },
              },
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
} satisfies Configuration;
