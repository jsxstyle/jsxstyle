// @ts-check

const nextPlugin = require('jsxstyle-webpack-plugin/lib/nextjs');

module.exports = nextPlugin()({
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
});
