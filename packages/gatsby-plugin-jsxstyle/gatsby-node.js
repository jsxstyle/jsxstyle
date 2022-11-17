const { JsxstyleWebpackPlugin } = require('jsxstyle/webpack-plugin');
const path = require('path');

exports.onCreateWebpackConfig = ({ actions, cache }) => {
  actions.setWebpackConfig({
    plugins: [new JsxstyleWebpackPlugin()],
    module: {
      rules: [
        {
          test: /\.(?:jsx?|tsx)$/,
          use: [
            {
              loader: JsxstyleWebpackPlugin.loader,
              options: {
                cacheFile: path.resolve(cache.directory, 'style-key-cache.txt'),
              },
            },
          ],
        },
      ],
    },
  });
};
