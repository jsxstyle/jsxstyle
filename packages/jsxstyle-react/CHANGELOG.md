# jsxstyle

## 3.0.0

### Minor Changes

- 1efdeb8: Combined jsxstyle and jsxstyle-utils. Partially inspired by #167.

  - jsxstyle-utils has been moved to a subfolder inside jsxstyle; utilities and types it provided can now be imported from `jsxstyle/utils`.
  - Rollup now always bundles `jsxstyle/utils` with jsxstyle rather than treating it like an external dependency. This allows the CommonJS bundle of jsxstyle to contain only essential utilities from `jsxstyle/utils`.

## 2.5.1

### Patch Changes

- a504a4a: Added a `key` prop to the `JsxstyleProps` interface in `jsxstyle/preact`

## 2.5.0

### Minor Changes

- 5c7973f: Mark generated components (`Block`, `Row`, etc.) as pure to allow them to be pruned if unused.

### Patch Changes

- Updated dependencies [a294cf4]
  - jsxstyle-utils@2.5.0
