# @jsxstyle/vite-plugin

## 2.0.0

### Breaking Changes

- Backend switched from Babel to SWC (`@jsxstyle/bundler-utils/swc`). The Babel `extractStyles` code path is removed entirely.
- Removed `staticModulePaths` option -- SWC does not support cross-module evaluation. This feature may return in a future release.
- Removed `cacheFile` option -- the counter-based class name strategy is deterministic per build and doesn't need disk persistence. Use `classNameStrategy: 'hash'` for content-based deterministic names.
- Removed `esbuild` and `invariant` dependencies.
- Removed `handleHotUpdate`, `buildStart`, `buildEnd` hooks -- HMR now relies entirely on Vite's built-in mechanisms.
- Style extraction moved from `load` hook to `transform` hook (more idiomatic Vite behavior).
- Vite peer dependency updated from `^6.0.3` to `>= 6 <= 7`.
- Plugin now requires `enforce: 'pre'` (set automatically) -- must appear before `@vitejs/plugin-react` in the plugins array.

### New Features

- `classNameStrategy: 'counter' | 'hash'` option -- counter (default, matches v1 behavior) or hash (content-based deterministic names).
- `debugClassNames: boolean` option -- when true, uses readable class names like `_x-display-flex` in dev mode. Automatically ignored in production builds.
- `noRuntime: boolean` option accepted (implementation coming in Phase 5).

### Migration from v1

- Remove `staticModulePaths` from plugin options.
- Remove `cacheFile` from plugin options.
- Move `jsxstyleVitePlugin()` before `reactPlugin()` in the Vite plugins array.
- Delete any `jsxstyle-cache.txt` files.

## 1.0.3

### Patch Changes

- Updated dependencies:
  - @jsxstyle/bundler-utils@1.0.3

## 1.0.2

### Patch Changes

- 457182d72bce12ebd3e49699ad38ae519382591c: Fixed a few type errors that were occuring because imports were resolving to workspace-level packages
- Updated dependencies:
  - @jsxstyle/bundler-utils@1.0.2

## 1.0.1

### Patch Changes

- ad398394b9e361c809c82483518192ed49407cd2: Patch bump all packages
- Updated dependencies:
  - @jsxstyle/bundler-utils@1.0.1

## 1.0.0

### Major Changes

- 0c39358ccb4f83a3ec159eb6f32e291fcaab613f: Split jsxstyle into separate modules using the `@jsxstyle` namespace. Imports have changed a bit:

  | Before                    | After                      |
  | ------------------------- | -------------------------- |
  | `jsxstyle`                | `@jsxstyle/react`          |
  | `jsxstyle/utils`          | `@jsxstyle/core`           |
  | `jsxstyle/preact`         | `@jsxstyle/preact`         |
  | `jsxstyle/webpack-plugin` | `@jsxstyle/webpack-plugin` |

### Patch Changes

- Updated dependencies:
  - @jsxstyle/bundler-utils@1.0.0
