const JsxstylePlugin = require('jsxstyle-webpack-plugin');

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    plugins: [new JsxstylePlugin()],
    module: {
      rules: [
        {
          test: /\.(jsx?|tsx)/,
          use: [JsxstylePlugin.loader],
        },
      ],
    },
  });
};
