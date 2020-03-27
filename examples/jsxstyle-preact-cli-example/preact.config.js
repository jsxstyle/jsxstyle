import JsxstylePlugin from 'jsxstyle-webpack-plugin';

export default function (config) {
  // add plugin
  config.plugins.push(new JsxstylePlugin());

  // append loader
  config.module.rules.push({
    test: /\.js$/,
    loader: JsxstylePlugin.loader,
    exclude: /node_modules/,
    enforce: 'pre',
    options: {
      // CSS module compatibility
      cssModules: true,
    },
  });
}
