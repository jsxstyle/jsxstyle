---
'jsxstyle': minor
'jsxstyle-react': minor
'jsxstyle-utils': minor
---

Combined jsxstyle and jsxstyle-utils. Partially inspired by #167.

- jsxstyle-utils has been moved to a subfolder inside jsxstyle; utilities and types it provided can now be imported from `jsxstyle/utils`.
- Rollup now always bundles `jsxstyle/utils` with jsxstyle rather than treating it like an external dependency. This allows the CommonJS bundle of jsxstyle to contain only essential utilities from `jsxstyle/utils`.
