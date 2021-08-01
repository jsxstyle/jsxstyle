const JsxstyleWebpackPlugin = require('jsxstyle-webpack-plugin');
const ReactIndexPlugin = require('../ReactIndexPlugin');

module.exports = {
  mode: 'production',
  entry: require.resolve('./entry'),

  output: {
    path: __dirname + '/build',
    filename: 'bundle.js',
  },

  plugins: [
    new ReactIndexPlugin(),
    new JsxstyleWebpackPlugin({
      staticModules: [require.resolve('./LayoutConstants')],
    }),
  ],

  resolve: {
    alias: {
      jsxstyle: require.resolve('jsxstyle'),
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
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
