---
'@jsxstyle/webpack-plugin': major
---

Made a few breaking config changes to `jsxstyle/webpack-plugin`:

- Renamed `whitelistedModules` option to `staticModules`.
- Improved static module support. Modules specified in the `staticModules` array are now compiled using the parent webpack config, so they can contain any syntax that the webpack config can compile. The main breaking change: the `staticModules` option is now passed directly to the plugin rather than as a loader option.
