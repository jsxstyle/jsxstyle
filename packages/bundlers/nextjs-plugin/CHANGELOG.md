# @jsxstyle/nextjs-plugin

## 1.0.2

### Patch Changes

- Updated dependencies:
  - @jsxstyle/webpack-plugin@3.0.2

## 1.0.1

### Patch Changes

- ad398394b9e361c809c82483518192ed49407cd2: Patch bump all packages
- Updated dependencies:
  - @jsxstyle/webpack-plugin@3.0.1
  - @jsxstyle/core@3.0.1

## 1.0.0

### Major Changes

- 60e0e0cead7720e30a6ce02292e944d7081c844d: Added a nextjs plugin that enables build-time style extraction.
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
  - @jsxstyle/webpack-plugin@3.0.0
