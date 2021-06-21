import rollupPluginTypescript from 'rollup-plugin-typescript2';
import rollupPluginBabel from '@rollup/plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';

export default [
  ['jsxstyle-utils', 'ts'],
  ['jsxstyle', 'ts'],
  ['jsxstyle/preact', 'tsx'],
].map(([pkg, ext]) => {
  const filename = pkg.replace(/[^a-z-]/g, '-');
  return {
    input: `packages/${pkg}/src/index.${ext}`,
    output: [
      {
        format: 'amd',
        file: `packages/${pkg}/lib/${filename}.js`,
        amd: { id: pkg },
      },
      { format: 'cjs', file: `packages/${pkg}/lib/${filename}.cjs.js` },
      { format: 'es', file: `packages/${pkg}/lib/${filename}.es.js` },
    ],
    plugins: [
      rollupPluginTypescript({
        tsconfig: `packages/${pkg}/tsconfig.json`,
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            // transpile as little as possible
            target: 'ESNext',
          },
        },
      }),
      rollupPluginBabel({
        cwd: `packages/${pkg}`,
        babelHelpers: 'bundled',
        extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
        presets: [['@babel/preset-env', { loose: true }]],
        plugins: [
          [
            require.resolve('./misc/babel-plugin-pure-annotation'),
            {
              functionNames: ['factory', 'depFactory'],
            },
          ],
        ],
      }),
    ],
    external: [
      'invariant',
      'jsxstyle',
      'jsxstyle-utils',
      'preact',
      'prop-types',
      'react',
    ],
    watch: { exclude: ['node_modules/**'] },
  };
});
