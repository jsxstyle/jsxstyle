// @ts-check
import rollupPluginTypescript from 'rollup-plugin-typescript2';
import rollupPluginBabel from '@rollup/plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';

/** @type {(pkg: string, formats?: Array<'amd' | 'cjs' | 'es'>) => import('rollup').RollupOptions} */
const makeRollupConfig = (pkg, formats = ['amd', 'cjs', 'es']) => {
  const filename = pkg.replace(/[^a-z-]/g, '-');
  return {
    input: `packages/${pkg}/src/index.ts`,
    output: formats.map((format) => {
      if (format === 'amd') {
        return {
          format: 'amd',
          file: `packages/${pkg}/lib/${filename}.js`,
          amd: { id: pkg },
        };
      }

      if (format === 'cjs') {
        return {
          format: 'cjs',
          file: `packages/${pkg}/lib/${filename}.cjs.js`,
        };
      }

      if (format === 'es') {
        return { format: 'es', file: `packages/${pkg}/lib/${filename}.es.js` };
      }

      throw new Error('Unsupported format: ' + format);
    }),
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
              functionNames: ['factory', 'depFactory', 'componentFactory'],
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
};

export default [
  makeRollupConfig('jsxstyle-utils'),
  makeRollupConfig('jsxstyle'),
  makeRollupConfig('jsxstyle/preact'),
];
