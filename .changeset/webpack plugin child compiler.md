---
'jsxstyle-webpack-plugin': major
---

Added initial support for compiling static modules using the parent webpack config. There’s only one breaking change: the array of modules that will be passed is now passed directly to the plugin rather than as a loader option.
