/** @type {import('next/types').NextConfig} */
module.exports = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  generateBuildId: async () => {
    const { spawnSync } = require('child_process');
    const gitHash = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: __dirname,
    })
      .stdout.toString()
      .trim();
    return gitHash;
  },

  webpack: (config, context) => {
    const JsxstyleWebpackPlugin = require('jsxstyle-webpack-plugin');
    const path = require('path');

    config.plugins.push(
      new JsxstyleWebpackPlugin({
        cacheFile: path.resolve(
          __dirname,
          '.next',
          'cache',
          'jsxstyle-cache.txt'
        ),
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
