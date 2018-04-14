import path = require('path');
import webpack = require('webpack');
import JsxstyleLoaderPlugin = require('jsxstyle-loader/plugin');
import ReactIndexPlugin = require('../../misc/ReactIndexPlugin');

const appSrc = path.join(__dirname, 'src');

const config: webpack.Configuration = {
  mode: 'development',
  entry: path.join(__dirname, './src/index.tsx'),
  output: {
    path: path.join(__dirname, 'build'),
    pathinfo: true,
    filename: 'bundle.js',
    chunkFilename: '[name].chunk.js',
    publicPath: '/',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  plugins: [new JsxstyleLoaderPlugin(), new ReactIndexPlugin()],

  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.(?:js|tsx?)/,
        exclude: /node_modules/,
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
        ],
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.tsx?$/,
            include: appSrc,
            // loaders run from bottom to top!
            use: [
              {
                loader: require.resolve('jsxstyle-loader'),
                options: { cacheFile: __dirname + '/jsxstyle-cache' },
              },
              {
                loader: require.resolve('ts-loader'),
                options: {
                  compilerOptions: {
                    module: 'esnext',
                  },
                },
              },
            ],
          },
          {
            test: /\.css$/,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                },
              },
            ],
          },
          {
            // test is a required key in webpack.Rule
            test: /./,
            loader: require.resolve('file-loader'),
            exclude: [/\.js$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
};

export = config;
