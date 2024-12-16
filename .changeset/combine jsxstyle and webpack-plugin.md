---
'@jsxstyle/webpack-plugin': major
---

Moved `jsxstyle-webpack-plugin` into the main jsxstyle package. The webpack plugin can now be imported from `jsxstyle/webpack-plugin`. The plugin export has also been changed to a named export:

```js
const { JsxstyleWebpackPlugin } = require('jsxstyle/webpack-plugin');
```
