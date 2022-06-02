import type { CacheObject, JsxstyleWebpackPluginOptions } from './types';
import type { NextConfig } from 'next/types';
import JsxstyleWebpackPlugin from './plugin';

export = (
  pluginOptions: Omit<
    JsxstyleWebpackPluginOptions,
    'cssMode' | 'cacheObject'
  > = {}
) => {
  // we keep the style cache object in memory here so that it gets shared between client and server builds
  const cacheObject: CacheObject = {};

  return (nextConfig: NextConfig = {}): NextConfig => {
    return {
      ...nextConfig,
      webpack: (config, context) => {
        config.plugins.push(
          new JsxstyleWebpackPlugin({
            ...pluginOptions,
            cacheObject,
            cssMode: 'styled-jsx',
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
