// @ts-check

const { DEFAULT_EXTENSIONS } = require('@babel/core');
const invariant = require('invariant');
const path = require('path');
const fs = require('fs').promises;
const rollupPluginBabel = require('@rollup/plugin-babel').default;
const rollupPluginResolve = require('@rollup/plugin-node-resolve').default;
const rollupPluginTypescript = require('@rollup/plugin-typescript').default;

/** @type {import('rollup').ModuleFormat[]} */
const supportedModuleFormats = ['cjs', 'es'];

const topLevelModules = ['preact', 'webpack-plugin'];

/** @type {Record<string, Partial<Record<'require' | 'import' | 'types', string>>>} */
const exportsObject = {};

/** @type {import('rollup').Plugin} */
const rollupPackageJsonPlugin = {
  name: 'module-package-json-files',
  async renderChunk(code, chunk, options) {
    if (!chunk.facadeModuleId) return null;
    const jsxstyleSrcDir = path.join(__dirname, 'packages', 'jsxstyle', 'src');

    const sourceTSFile = path.relative(jsxstyleSrcDir, chunk.facadeModuleId);
    invariant(
      sourceTSFile.endsWith('.ts') || sourceTSFile.endsWith('.tsx'),
      'Expected a TypeScript source file'
    );

    const prefix = topLevelModules.includes(chunk.name) ? './' : './lib/';
    const modulePath = chunk.name === 'jsxstyle' ? '.' : prefix + chunk.name;
    const moduleEntry = (exportsObject[modulePath] ||= {});

    // this needs to go first
    moduleEntry['types'] =
      './lib/types/' + sourceTSFile.replace(/\.tsx?$/, '.d.ts');

    if (options.format === 'cjs') {
      moduleEntry['require'] = './' + chunk.fileName;
    } else if (options.format === 'es') {
      moduleEntry['import'] = './' + chunk.fileName;
    } else {
      throw new Error('Unhandled format: ' + options.format);
    }

    return null;
  },
  async writeBundle() {
    const sortedEntries = Object.fromEntries(
      Object.entries(exportsObject)
        .map(
          /** @returns {[string, any]} */
          ([key, value]) => {
            return [
              key,
              {
                // `types` always goes first: https://nodejs.org/api/packages.html#community-conditions-definitions
                types: value.types,
                import: value.import,
                require: value.require,
              },
            ];
          }
        )
        .sort(([a], [b]) => a.localeCompare(b))
    );

    const pkgJsonPath = path.join(
      __dirname,
      'packages',
      'jsxstyle',
      'package.json'
    );
    const pkgJsonContent = await fs.readFile(pkgJsonPath, 'utf-8');
    const pkgJson = JSON.parse(pkgJsonContent);
    pkgJson.exports = sortedEntries;
    pkgJson.main = exportsObject['.'].require;
    pkgJson.module = exportsObject['.'].import;
    pkgJson.types = exportsObject['.'].types;
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
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
