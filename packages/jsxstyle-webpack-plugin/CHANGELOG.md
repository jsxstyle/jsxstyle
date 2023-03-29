# jsxstyle-webpack-plugin

## 3.0.0

### Major Changes

- 77951e4: Moved `jsxstyle-webpack-plugin` into the main jsxstyle package. The webpack plugin can now be imported from `jsxstyle/webpack-plugin`. The plugin export has also been changed to a named export:

  ```js
  const { JsxstyleWebpackPlugin } = require('jsxstyle/webpack-plugin');
  ```

- 4d2bc2a: Implemented one className per style prop functionality.
- 0a7e20b: Moved `cacheFile` option and `classNameFormat` options from the webpack loader to the plugin.
- dbd1f6e: Removed style group support from the webpack plugin.
- f8b0322: Removed support for webpack 1-4. webpack 1-3 were already untested so this was mostly a formality.
- 92ded84: Made a few breaking config changes to `jsxstyle/webpack-plugin`:

  - Renamed `whitelistedModules` option to `staticModules`.
  - Improved static module support. Modules specified in the `staticModules` array are now compiled using the parent webpack config, so they can contain any syntax that the webpack config can compile. The main breaking change: the `staticModules` option is now passed directly to the plugin rather than as a loader option.

### Minor Changes

- 47f9c96: Added inline CSS import support to `jsxstyle/webpack-plugin`. This officially replaces the virtual filesystem stuff we were doing behind the scenes.

  You can enable this new option by setting `inlineImports` to either `single` or `multiple` in your `jsxstyle/webpack-plugin` settings.

  - When `inlineImports` is set to `single`, one import will be prepended to each processed file. This import will contain all the extracted CSS rules from the file. This is equivalent to what `jsxstyle/webpack-plugin` has already been doing.
  - When `inlineImports` is set to `multiple`, one import _per CSS rule_ will be prepended to the file. This option allows webpack to dedupe extracted CSS with perfect precision, but it does so by generating hundreds and possibly even _thousands_ of new modules at build time. This may have adverse effects on webpack’s build time.
