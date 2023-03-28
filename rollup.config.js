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

const topLevelModules = ['preact', 'solid', 'utils', 'webpack-plugin'];

/** @type {Record<string, Partial<Record<'require' | 'import' | 'types', string>>>} */
const exportsObject = {};

/** @type {import('rollup').Plugin} */
const rollupPackageJsonPlugin = {
  name: 'module-package-json-files',
  async renderChunk(code, chunk, options) {
    if (!chunk.facadeModuleId) return null;
    const jsxstyleDir = path.join(__dirname, 'packages', 'jsxstyle');

    const sourceTSFile = path.relative(jsxstyleDir, chunk.facadeModuleId);
    invariant(
      sourceTSFile.endsWith('.ts') || sourceTSFile.endsWith('.tsx'),
      'Expected a TypeScript source file'
    );

    const prefix = topLevelModules.includes(chunk.name) ? './' : './lib/';
    const modulePath = chunk.name === 'react' ? '.' : prefix + chunk.name;
    const moduleEntry = (exportsObject[modulePath] ||= {});

    moduleEntry['types'] =
      './' + sourceTSFile.replace('/src/', '/lib/').replace(/\.tsx?$/, '.d.ts');

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
    'preact':         'packages/jsxstyle/preact/src/index.ts',
    'react':          'packages/jsxstyle/react/src/index.ts',
    'solid':          'packages/jsxstyle/solid/src/index.tsx',
    'utils':          'packages/jsxstyle/utils/src/index.ts',

    'webpack-plugin': 'packages/jsxstyle/webpack-plugin/src/plugin.ts',
    'webpack-loader': 'packages/jsxstyle/webpack-plugin/src/loader.ts',

    'base64-loader':  'packages/jsxstyle/webpack-plugin/src/base64Loader.ts',
    'noop':           'packages/jsxstyle/webpack-plugin/src/noop.ts',
    'nextjs-plugin':  'packages/jsxstyle/webpack-plugin/src/nextjs.ts',
    'extract-styles': 'packages/jsxstyle/webpack-plugin/src/utils/ast/extractStyles.ts',
  },
  output: supportedModuleFormats.map(
    /** @returns {import('rollup').OutputOptions} */
    (format) => ({
      format,
      interop: 'compat',
      dir: 'packages/jsxstyle',
      entryFileNames: `lib/[name]/index.[format].js`,
      chunkFileNames: `lib/chunks/[name].[hash].[format].js`,
      sourcemap: true,
    })
  ),
  plugins: [
    rollupPackageJsonPlugin,
    ['preact', 'react', 'utils', 'solid', 'webpack-plugin'].map((dir) => {
      return rollupPluginTypescript({
        tsconfig: `packages/jsxstyle/${dir}/tsconfig.json`,
      });
    }),
    rollupPluginResolve({ preferBuiltins: true }),
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
    'solid-js',
    'solid-js/types',
    'solid-js/web',
    'util',
    'vm',
    'webpack/lib/node/NodeWatchFileSystem',
  ],
  watch: { exclude: ['node_modules/**'] },
};
