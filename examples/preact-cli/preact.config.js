import JsxstyleLoaderPlugin from 'jsxstyle-loader/plugin';
export default function(config) {
  // add plugin
  config.plugins.push(new JsxstyleLoaderPlugin());

  // append loader
  config.module.loaders.push({
    test: /\.js$/,
    loader: 'jsxstyle-loader',
    exclude: /node_modules/,
    enforce: 'pre',
    options: {
      // CSS module compatibility
      cssModules: true,
    },
  });
}
