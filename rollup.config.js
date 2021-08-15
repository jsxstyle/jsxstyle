// @ts-check
import rollupPluginTypescript from 'rollup-plugin-typescript2';
import rollupPluginBabel from '@rollup/plugin-babel';
import path from 'path';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/** @type {(options: { from: string, to: string }) => import('rollup').Plugin} */
const resolveJsxstyleUtilsPlugin = ({ from, to }) => ({
  name: 'ResolveJsxstyleUtilsPlugin',
  async resolveId(source, importer) {
    const result = await this.resolve(source, importer, { skipSelf: true });
    if (source === from) {
      return to;
    }
    return result;
  },
});

/**
 * @type {(packageName: string, formats?: Array<'amd' | 'cjs' | 'es'>) => import('rollup').RollupOptions} */
const makeRollupConfig = (packageName, formats = ['amd', 'cjs', 'es']) => {
  const packageDir = path.join(__dirname, 'packages', packageName);
  const srcRoot = path.join(packageDir, 'src');
  const libRoot = path.join(packageDir, 'lib');
  const tsconfigPath = path.join(packageDir, 'tsconfig.json');
  const outputBasename = packageName.replace(/[^a-z]/, '-');

  return {
    input: path.join(srcRoot, 'index.ts'),
    output: formats.map((format) => {
      if (format === 'amd') {
        return {
          format: 'amd',
          file: path.join(libRoot, outputBasename + '.js'),
          amd: { id: outputBasename },
        };
      }

      if (format === 'cjs') {
        return {
          format: 'cjs',
          file: path.join(libRoot, outputBasename + '.cjs.js'),
        };
      }

      if (format === 'es') {
        return {
          format: 'es',
          file: path.join(libRoot, outputBasename + '.es.js'),
        };
      }

      throw new Error('Unsupported format: ' + format);
    }),
    plugins: [
      resolveJsxstyleUtilsPlugin({
        from: 'jsxstyle/utils',
        to: path.resolve(
          __dirname,
          'packages',
          'jsxstyle',
          'utils',
          'src',
          'index.ts'
        ),
      }),
      {
        name: 'GenerateTypesPlugin',
        async buildEnd() {
          await execAsync(`yarn tsc -p ${tsconfigPath} --emitDeclarationOnly`);
        },
      },
      rollupPluginTypescript({
        tsconfig: tsconfigPath,
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            // transpile as little as possible
            target: 'ESNext',
            // we'll handle type output separately
            declaration: false,
            declarationMap: false,
          },
        },
      }),
      rollupPluginBabel({
        cwd: packageDir,
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
    external: ['invariant', 'preact', 'prop-types', 'react'],
    watch: { exclude: ['node_modules/**'] },
  };
};

export default [
  makeRollupConfig('jsxstyle/utils'),
  makeRollupConfig('jsxstyle/react'),
  makeRollupConfig('jsxstyle/preact'),
];
