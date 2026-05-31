import { createRequire } from 'node:module';
import { validateOptions } from '@jsxstyle/bundler-utils';
import type { PluginOptions } from '@jsxstyle/bundler-utils';

const customRequire = createRequire(import.meta.url);

export type JsxstyleNextjsPluginOptions = PluginOptions;

export const withJsxstyle = (
  pluginOptions: JsxstyleNextjsPluginOptions = {}
) => {
  validateOptions(
    'jsxstyle-nextjs-plugin',
    pluginOptions as Record<string, unknown>
  );

  const {
    extensions = ['.ts', '.tsx', '.js', '.jsx'],
    classNameStrategy = 'hash', // Default to hash for Next.js (safer with client/server builds)
    classNamePrefix = '_x',
    debugClassNames,
    noRuntime,
  } = pluginOptions;

  // Shared cache between client/server webpack builds.
  // Created once in the closure -- the webpack callback is called 3 times
  // (nodejs server, edge server, client) and they all share this cache.
  const cacheObject: Record<string, string> = {};

  // Serializable options for Turbopack (no functions, no class instances)
  const turbopackOptions = {
    classNameStrategy,
    classNamePrefix,
    ...(debugClassNames !== undefined ? { debugClassNames } : {}),
    ...(noRuntime !== undefined ? { noRuntime } : {}),
  };

  const extensionPattern = extensions.map((e) => e.replace('.', '')).join('|');
  const testRegex = new RegExp(`\\.(?:${extensionPattern})$`);

  return <T extends Record<string, any>>(nextConfig: T = {} as T): T => ({
    ...nextConfig,

    // Webpack mode: plugin + loader
    webpack: (config: any, context: any) => {
      const resolvedDebugClassNames =
        debugClassNames !== undefined ? debugClassNames : context.dev;

      // Lazy-load webpack-loader and set per-compiler context
      const { setContext } = customRequire(
        customRequire.resolve('@jsxstyle/nextjs-plugin/webpack-loader')
      );

      // memfs for virtual CSS modules -- one per webpack invocation
      // (Next.js fires webpack callback 3 times: nodejs, edge, client)
      const { Volume } = customRequire('memfs');
      const memoryFS = new Volume();

      // Lazy-load wrapFileSystem for memfs overlay on compiler's input file system
      const { wrapFileSystem } = customRequire('@jsxstyle/bundler-utils');

      config.resolve = config.resolve || {};
      config.resolve.plugins = config.resolve.plugins || [];
      config.plugins = config.plugins || [];
      config.plugins.push({
        apply(compiler: any) {
          // Set per-compiler context in the WeakMap
          setContext(compiler, {
            pluginOptions: {
              classNameStrategy,
              classNamePrefix,
              debugClassNames: resolvedDebugClassNames,
              noRuntime,
            },
            cacheObject,
            memoryFS,
          });

          // Wrap the compiler's input file system with memfs overlay
          compiler.hooks.afterEnvironment.tap('JsxstyleNextjsPlugin', () => {
            compiler.inputFileSystem = wrapFileSystem(
              compiler.inputFileSystem,
              memoryFS
            );
          });
        },
      });

      // Add loader rule
      config.module.rules.push({
        test: testRegex,
        include: context.dir,
        use: [
          {
            loader: customRequire.resolve(
              '@jsxstyle/nextjs-plugin/webpack-loader'
            ),
          },
        ],
      });

      // Chain with existing webpack config
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, context);
      }
      return config;
    },

    // Turbopack mode: loader only (no plugins -- Turbopack doesn't support them)
    turbopack: {
      ...(nextConfig as any).turbopack,
      rules: {
        ...(nextConfig as any).turbopack?.rules,
        ...Object.fromEntries(
          extensions.map((ext) => [
            `*${ext}`,
            {
              loaders: [
                {
                  loader: customRequire.resolve(
                    '@jsxstyle/nextjs-plugin/turbopack-loader'
                  ),
                  options: turbopackOptions,
                },
              ],
              as: `*${ext}`,
            },
          ])
        ),
      },
    },
  });
};
