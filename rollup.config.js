// @ts-check

const { DEFAULT_EXTENSIONS } = require('@babel/core');
const invariant = require('invariant');
const path = require('path');
const rollupPluginBabel = require('@rollup/plugin-babel').default;
const rollupPluginResolve = require('@rollup/plugin-node-resolve').default;
const rollupPluginTypescript = require('@rollup/plugin-typescript').default;

/** @type {import('rollup').ModuleFormat[]} */
const supportedModuleFormats = ['cjs', 'es'];

const topLevelModules = ['preact', 'webpack-plugin'];

/** @type {import('rollup').Plugin} */
const rollupPackageJsonPlugin = {
  name: 'module-package-json-files',
  async renderChunk(code, chunk, options) {
    if (options.format !== 'cjs' || !chunk.isEntry) return null;

    const jsxstyleDir = path.join(__dirname, 'packages', 'jsxstyle');
    const jsxstyleSrcDir = path.join(jsxstyleDir, 'src');
    const jsxstyleLibDir = path.join(jsxstyleDir, 'lib');
    const jsxstyleTypesDir = path.join(jsxstyleLibDir, 'types');

    if (!chunk.facadeModuleId) return null;

    const sourceTSFile = path.relative(jsxstyleSrcDir, chunk.facadeModuleId);
    invariant(
      sourceTSFile.endsWith('.ts') || sourceTSFile.endsWith('.tsx'),
      'Expected a TypeScript source file'
    );

    const packageJsonDir = path.join(
      topLevelModules.includes(chunk.name) ? jsxstyleDir : jsxstyleLibDir,
      chunk.name
    );

    const packageJsonFileName = path.join(
      path.relative(jsxstyleDir, packageJsonDir),
      'package.json'
    );

    const mainEntry = path.relative(
      packageJsonDir,
      path.join(jsxstyleDir, chunk.fileName)
    );

    const moduleEntry = path.relative(
      packageJsonDir,
      path.join(jsxstyleDir, chunk.fileName.replace(/\.cjs\.js$/, '.es.js'))
    );

    const typesEntry = path.relative(
      packageJsonDir,
      path.join(jsxstyleTypesDir, sourceTSFile.replace(/\.tsx?$/, '.d.ts'))
    );

    this.emitFile({
      type: 'asset',
      fileName: packageJsonFileName,
      source:
        JSON.stringify(
          {
            name: 'jsxstyle-' + chunk.name,
            main: mainEntry,
            module: moduleEntry,
            types: typesEntry,
            private: true,
            sideEffects: false,
          },
          null,
          2
        ) + '\n',
    });

    return null;
  },
};

/** @type {import('rollup').RollupOptions} */
module.exports = {
  context: 'packages/jsxstyle',
  // prettier-ignore
  input: {
    'jsxstyle':       'packages/jsxstyle/src/react/index.ts',
    'preact':         'packages/jsxstyle/src/preact/index.ts',

    'webpack-plugin': 'packages/jsxstyle/src/webpack-plugin/plugin.ts',
    'webpack-loader': 'packages/jsxstyle/src/webpack-plugin/loader.ts',

    'base64-loader':  'packages/jsxstyle/src/webpack-plugin/base64Loader.ts',
    'noop':           'packages/jsxstyle/src/webpack-plugin/noop.ts',
    'nextjs-plugin':  'packages/jsxstyle/src/webpack-plugin/nextjs.ts',
    'extract-styles': 'packages/jsxstyle/src/webpack-plugin/utils/ast/extractStyles.ts',
  },
  output: supportedModuleFormats.map(
    /** @returns {import('rollup').OutputOptions} */
    (format) => ({
      format,
      interop: 'compat',
      dir: 'packages/jsxstyle',
      // exports: 'named',
      entryFileNames: `lib/[name]/[name].[format].js`,
      chunkFileNames: `lib/chunks/[name].[hash].[format].js`,
      amd: format === 'amd' ? { autoId: true } : undefined,
      // hoistTransitiveImports: false,
      sourcemap: true,
    })
  ),
  plugins: [
    rollupPackageJsonPlugin,
    rollupPluginTypescript({
      tsconfig: 'packages/jsxstyle/tsconfig.json',
    }),
    rollupPluginResolve({ browser: false, preferBuiltins: true }),
    rollupPluginBabel({
      cwd: path.join(__dirname, 'packages', 'jsxstyle'),
      babelHelpers: 'bundled',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
    }),
  ],
  external: [
    '@babel/generator',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    'fs',
    'invariant',
    'memfs',
    'module',
    'path',
    'preact',
    'prop-types',
    'react',
    'util',
    'vm',
    'webpack/lib/node/NodeWatchFileSystem',
  ],
  watch: { exclude: ['node_modules/**'] },
};
