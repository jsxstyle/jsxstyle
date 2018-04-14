import path from 'path';

export default function(config) {
  config.module.loaders.push({
    enforce: 'pre',
    test: /\.tsx?$/,
    loader: 'ts-loader',
  });

  config.resolve.alias['preact-cli-entrypoint'] = path.resolve(
    process.cwd(),
    'src',
    'index'
  );

  return config;
}
