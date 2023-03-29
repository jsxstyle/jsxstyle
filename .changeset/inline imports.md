---
'jsxstyle-webpack-plugin': minor
---

Added inline CSS import support to `jsxstyle/webpack-plugin`. This officially replaces the virtual filesystem stuff we were doing behind the scenes.

You can enable this new option by setting `inlineImports` to either `single` or `multiple` in your `jsxstyle/webpack-plugin` settings.

- When `inlineImports` is set to `single`, one import will be prepended to each processed file. This import will contain all the extracted CSS rules from the file. This is equivalent to what `jsxstyle/webpack-plugin` has already been doing.
- When `inlineImports` is set to `multiple`, one import _per CSS rule_ will be prepended to the file. This option allows webpack to dedupe extracted CSS with perfect precision, but it does so by generating hundreds and possibly even _thousands_ of new modules at build time. This may have adverse effects on webpack’s build time.
