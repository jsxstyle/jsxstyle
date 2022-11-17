// @ts-check

const { JsxstyleWebpackPlugin } = require('jsxstyle/webpack-plugin');
const path = require('path');
const { ReactIndexPlugin } = require('../ReactIndexPlugin');

const appSrc = path.join(__dirname, 'src');

/** @type {import('webpack').Configuration} */
module.exports = {
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
                [require.resolve('@babel/preset-env'), { modules: false }],
                require.resolve('@babel/preset-react'),
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
                loader: JsxstyleWebpackPlugin.loader,
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
