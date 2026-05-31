# @jsxstyle/vite-plugin

Vite plugin for extracting static styles from jsxstyle components at build time using SWC.

## Installation

```sh
npm install @jsxstyle/vite-plugin
```

Or with pnpm/yarn:

```sh
pnpm add @jsxstyle/vite-plugin
yarn add @jsxstyle/vite-plugin
```

## Usage

Add `jsxstyleVitePlugin()` to your Vite config. It **must** appear before `reactPlugin()` in the plugins array:

```javascript
import { jsxstyleVitePlugin } from '@jsxstyle/vite-plugin';
import reactPlugin from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [jsxstyleVitePlugin(), reactPlugin()],
});
```

The plugin uses `enforce: 'pre'` internally, so it runs before other plugins in the same enforce tier. Placing it before `reactPlugin()` ensures correct ordering.

## Options

### `extensions`

**Type:** `string[]`
**Default:** `['.ts', '.tsx', '.js']`

File extensions to transform. Only files matching these extensions will be processed for style extraction.

### `classNamePrefix`

**Type:** `string`
**Default:** `'_x'`

Prefix for generated class names.

### `classNameStrategy`

**Type:** `'counter' | 'hash'`
**Default:** `'counter'`

Strategy for generating class names:

- `'counter'` -- produces compact, order-dependent names like `_x0`, `_x1`, `_x2`. Matches v1 behavior.
- `'hash'` -- produces content-based deterministic names. Useful when class name stability across builds is important.

### `debugClassNames`

**Type:** `boolean`
**Default:** `false`

When `true`, uses readable class names like `_x-display-flex` in dev mode. Automatically ignored in production builds.

### `noRuntime`

**Type:** `boolean`
**Default:** `false`

Accepted but not yet implemented. Coming in a future release.

## Migrating from v1

### 1. Removed `staticModulePaths` option

SWC does not support cross-module evaluation. Remove this option from your plugin config.

Imports from other modules still work at the JS level but won't be statically evaluated at build time. If you were relying on `staticModulePaths` for constants defined in separate files, those values will now be resolved at runtime instead of being extracted into static CSS.

### 2. Removed `cacheFile` option

The counter-based class name strategy is deterministic per build and doesn't need disk persistence. Remove this option from your plugin config and delete any `jsxstyle-cache.txt` files from your project.

### 3. Plugin ordering requirement

`jsxstyleVitePlugin()` must appear **before** `reactPlugin()` in the Vite plugins array. The plugin uses `enforce: 'pre'` internally, and correct ordering within the same enforce tier requires it to be listed first.

```diff
 export default defineConfig({
   plugins: [
-    reactPlugin(),
-    jsxstyleVitePlugin({ staticModulePaths: [...] }),
+    jsxstyleVitePlugin(),
+    reactPlugin(),
   ],
 });
```

### 4. Removed cache file cleanup

The `buildStart` and `buildEnd` hooks that managed cache files are removed. No action needed.

### 5. New `classNameStrategy` option

Choose between `'counter'` (default, matches v1 behavior) and `'hash'` (content-based deterministic names):

```javascript
jsxstyleVitePlugin({
  classNameStrategy: 'hash',
});
```

### 6. New `debugClassNames` option

Opt-in to readable class names in dev mode:

```javascript
jsxstyleVitePlugin({
  debugClassNames: true,
});
```

This is automatically ignored in production builds.
