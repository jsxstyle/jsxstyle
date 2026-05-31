---
"@jsxstyle/bundler-utils": major
---

Phase 8: Remove Babel extractor and make SWC the only backend

## Breaking Changes

### @jsxstyle/bundler-utils

- `./babel` subpath export removed -- Babel extractor fully deleted
- `./swc` subpath export removed -- `transform()` now exported from main entry point
- `extractStyles` function removed from public API
- `TransformOptions` and `TransformResult` types removed (use `PluginOptions` and `PluginTransformResult`)
- Import path change: `@jsxstyle/bundler-utils/swc` -> `@jsxstyle/bundler-utils`
- `debugClassNames` now defaults to `true` in dev mode across all plugins
- All `@babel/*` dependencies removed
