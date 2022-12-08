// @ts-check

// TODO(meyer) re-enable this plugin
// const { jsxstyleNextjsPlugin } = require('jsxstyle/lib/nextjs-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, options) => {
    // hack to allow global CSS imports in monaco-editor
    config.module.rules
      .find((rule) => rule.oneOf)
      .oneOf.forEach((r) => {
        if (r.issuer?.and?.[0]?.toString().includes('_app')) {
          r.issuer = [
            { and: r.issuer.and },
            /[\\/]node_modules[\\/]monaco-editor[\\/]/,
          ];
        }
      });

    if (!options.isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ['javascript', 'typescript', 'json'],
          filename: 'static/[name].worker.js',
          publicPath: '_next',
        })
      );
    }

    return config;
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
};
