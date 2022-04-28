---
'jsxstyle-webpack-plugin': minor
---

Added inline CSS import support. You can enable the option by setting `inlineImports` to either `single` or `multiple` in your `jsxstyle-webpack-plugin` settings.

Assuming a file has styles that `jsxstyle-webpack-plugin` can extract:

- When `inlineImports` is set to `single`, one import will be prepended to the processed file. This import will contain all the extracted CSS rules from the file.
- When `inlineImports` is set to `multiple`, one import _per CSS rule_ will be prepended to the file. The `multiple` option may very well cause performance issues in large applications. I’m not sure how well webpack does with potentially thousands of extra modules. It will result in incredibly accurate CSS rule deduping however, since each CSS rule is now a module that webpack can hoist and dedupe.
