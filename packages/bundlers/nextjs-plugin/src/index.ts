import type { CacheObject } from '@jsxstyle/core';
import { JsxstyleWebpackPlugin } from '@jsxstyle/webpack-plugin';
import type { JsxstyleWebpackPluginOptions } from '@jsxstyle/webpack-plugin';

export const jsxstyleNextjsPlugin = (
  pluginOptions: Omit<JsxstyleWebpackPluginOptions, 'cacheObject'> = {}
) => {
  // we keep the style cache object in memory here so that it gets shared between client and server builds
  const cacheObject: CacheObject = {};

  return <T extends { webpack?: (...args: any[]) => any }>(
    nextConfig: T = {} as any
  ): T => {
    return {
      ...nextConfig,
      webpack: (config, context) => {
        config.plugins.push(
          new JsxstyleWebpackPlugin({
            cssMode: 'styled-jsx',
            ...pluginOptions,
            cacheObject,
          })
        );

        config.module.rules.push({
          test: /\.(?:js|tsx?)$/,
          include: context.dir,
          use: [JsxstyleWebpackPlugin.loader],
        });

        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, context);
        }

        return config;
      },
    };
  };
};
