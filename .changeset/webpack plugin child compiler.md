---
'jsxstyle-webpack-plugin': major
---

Renamed `whitelistedModules` option to `staticModules` and improved static module support. Modules specified in the `staticModules` array are now compiled using the parent webpack config, so they can contain any syntax that the webpack config can compile. The main breaking change: the `staticModules` option is now passed directly to the plugin rather than as a loader option.
