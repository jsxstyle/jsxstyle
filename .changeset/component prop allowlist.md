---
'jsxstyle-utils': minor
---

Added common component prop filtering. Common props like `type`, `name`, and [a few others](https://github.com/jsxstyle/jsxstyle/blob/f6408ad/packages/jsxstyle-utils/src/getStyleKeysForProps.ts#L10-L21) can now be set at the top level of a jsxstyle component. This should make both styling and configuring commonly-used components like inputs, buttons, and links a bit less painful. For additional context, see #147.
