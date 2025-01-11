---
"@jsxstyle/webpack-plugin": major
"@jsxstyle/vite-plugin": major
"@jsxstyle/preact": major
"@jsxstyle/react": major
"@jsxstyle/core": major
"@jsxstyle/bundler-utils": major
"@jsxstyle/nextjs-plugin": major
"@jsxstyle/solid": major
---

Split jsxstyle into separate modules using the `@jsxstyle` namespace. Imports have changed a bit:

| Before | After |
|----|----|
| `jsxstyle` | `@jsxstyle/react` |
| `jsxstyle/utils` | `@jsxstyle/core` |
| `jsxstyle/preact` | `@jsxstyle/preact` |
| `jsxstyle/webpack-plugin` | `@jsxstyle/webpack-plugin` |
