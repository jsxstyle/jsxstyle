# jsxstyle-utils

## 3.0.0

### Major Changes

- 4d2bc2a: Implemented one className per style prop functionality.
- b4c61dc: Removed IE11 from the list of supported browsers.

### Minor Changes

- b4ad4cc: Added a new utility, `makeCustomProperties`, that makes generating CSS custom properties a whole lot easier. It’s currently exported as `EXPERIMENTAL_makeCustomProperties`. I’ll remove the "EXPERIMENTAL" prefix once it’s been battle tested a bit.
- 1efdeb8: Combined jsxstyle and jsxstyle-utils. Partially inspired by #167.

  - jsxstyle-utils has been moved to a subfolder inside jsxstyle; utilities and types it provided can now be imported from `jsxstyle/utils`.
  - Rollup now always bundles `jsxstyle/utils` with jsxstyle rather than treating it like an external dependency. This allows the CommonJS bundle of jsxstyle to contain only essential utilities from `jsxstyle/utils`.

- f6408ad: Added common component prop filtering. Common props like `type`, `name`, and [a few others](https://github.com/jsxstyle/jsxstyle/blob/f6408ad/packages/jsxstyle-utils/src/getStyleKeysForProps.ts#L10-L21) can now be set at the top level of a jsxstyle component. This should make both styling and configuring commonly-used components like inputs, buttons, and links a bit less painful. For additional context, see #147.
- b736a71: Ensured that style rules are only written to the DOM one time.
- 473e9e0: Added a new exported function, `processProps`, that turns an object of style props and component props into an object of component props and an array of CSS rules. `processProps` powers the “one classname per style prop” functionality introduced in #163.
