/** @type {import('next/types').NextConfig} */
module.exports = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  webpack: (config, context) => {
    const JsxstyleWebpackPlugin = require('jsxstyle-webpack-plugin');
    const path = require('path');

    config.plugins.push(
      new JsxstyleWebpackPlugin({
        cacheFile: path.resolve(__dirname, 'jsxstyle-cache.txt'),
        cssMode: 'nextjs',
      })
    );

    config.module.rules.push({
      test: /\.(?:js|tsx?)$/,
      include: context.dir,
      use: [JsxstyleWebpackPlugin.loader],
    });

    return config;
  },
};
