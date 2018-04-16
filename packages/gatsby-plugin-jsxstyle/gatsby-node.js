const JsxstyleLoaderPlugin = require('jsxstyle-loader/plugin');

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    plugins: [new JsxstyleLoaderPlugin()],
    module: {
      rules: [
        {
          test: /\.(jsx?|tsx)/,
          use: [require.resolve('jsxstyle-loader')],
        },
      ],
    },
  });
};
