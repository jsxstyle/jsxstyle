# jsxstyle

## 3.0.0

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
  - @jsxstyle/core@3.0.0

## 2.5.1

### Patch Changes

- a504a4a: Added a `key` prop to the `JsxstyleProps` interface in `jsxstyle/preact`

## 2.5.0

### Minor Changes

- 5c7973f: Mark generated components (`Block`, `Row`, etc.) as pure to allow them to be pruned if unused.

### Patch Changes

- Updated dependencies [a294cf4]
  - jsxstyle-utils@2.5.0
