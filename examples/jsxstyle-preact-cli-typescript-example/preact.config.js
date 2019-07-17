import path from 'path';

export default (config, env, helpers, options) => {
  config.module.rules.push({
    enforce: 'pre',
    test: /\.tsx?$/,
    loader: 'ts-loader',
  });

  return config;
};
