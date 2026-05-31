---
"@jsxstyle/bundler-utils": major
"@jsxstyle/webpack-plugin": major
"@jsxstyle/nextjs-plugin": major
"@jsxstyle/vite-plugin": major
"@jsxstyle/rspack-plugin": minor
---

Phase 6: SWC backend for all bundler plugins

## Breaking Changes

### @jsxstyle/bundler-utils

- NAPI API redesigned: class name generation moved to Rust, eliminating per-style-key JS callback overhead
- `getClassNameForKey` callback removed from transform options
- New options: `classNameStrategy`, `classNamePrefix`, `debugClassNames`, `cacheObject`
- Transform result now includes `cacheObject`, `errors[]`, and `warnings[]`
- Babel dependencies fully removed (Phase 8)

### @jsxstyle/webpack-plugin (4.0.0)

- Rewritten to use SWC backend exclusively (Babel removed)
- `classNameFormat` option renamed to `classNameStrategy`
- `base64Loader` and `noop` exports removed
- All `@babel/*` dependencies dropped

### @jsxstyle/nextjs-plugin (2.0.0)

- Rewritten to use SWC backend directly (no webpack-plugin dependency)
- Supports both webpack and Turbopack modes via `withJsxstyle()` HOF
- Minimum Next.js version raised to 14+
- `jsxstyleNextjsPlugin` renamed to `withJsxstyle`

### @jsxstyle/vite-plugin

- Updated to use Rust-side class name generation
- `@jsxstyle/core` dependency removed (no longer needed)

## New Package

### @jsxstyle/rspack-plugin (0.1.0)

- New package for Rspack/Rsbuild integration
- Uses Rspack native VirtualModulesPlugin for CSS delivery
- Class-based API: `new JsxstyleRspackPlugin(options)`
