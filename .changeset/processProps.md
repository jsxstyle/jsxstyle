---
'jsxstyle-utils': minor
---

Added a new exported function, `processProps`, that turns an object of style props and component props into an object of component props and an array of CSS rules. `processProps` powers the “one classname per style prop” functionality introduced in #163.
