# @jsxstyle/vite-plugin

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
