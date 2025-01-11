# @jsxstyle/core

## 3.0.0-beta.0

### Major Changes

- 4d2bc2a35d60393b54871eec4006e5347eb93610: Implemented one className per style prop functionality.
- 0c39358ccb4f83a3ec159eb6f32e291fcaab613f: Split jsxstyle into separate modules using the `@jsxstyle` namespace. Imports have changed a bit:

  | Before                    | After                      |
  | ------------------------- | -------------------------- |
  | `jsxstyle`                | `@jsxstyle/react`          |
  | `jsxstyle/utils`          | `@jsxstyle/core`           |
  | `jsxstyle/preact`         | `@jsxstyle/preact`         |
  | `jsxstyle/webpack-plugin` | `@jsxstyle/webpack-plugin` |

### Minor Changes

- b4ad4cc21060f3eb05afc7acc66f9af81a0c2925: Added a new utility, `makeCustomProperties`, that makes generating CSS custom properties a whole lot easier.
- f6408adb9e9e46419d1bf2c4e8bf2ddb0f561012: Added common component prop filtering. Common props like `type`, `name`, and [a few others](https://github.com/jsxstyle/jsxstyle/blob/f6408ad/packages/jsxstyle-utils/src/getStyleKeysForProps.ts#L10-L21) can now be set at the top level of a jsxstyle component. This should make both styling and configuring commonly-used components like inputs, buttons, and links a bit less painful. For additional context, see #147.
- 473e9e045f317e3d06013ea5773ea911290009c4: Added a new exported function, `processProps`, that turns an object of style props and component props into an object of component props and an array of CSS rules. This function provides jsxstyle’s core style creation functionality and is used in all runtimes and bundler plugins.
