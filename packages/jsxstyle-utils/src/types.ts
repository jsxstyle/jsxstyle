import { Properties } from 'csstype';

/**
 * Make all properties in `T` potentially `null` or `false`.
 *
 * Note: `Falsey` is not the best name, as jsxstyle considers zero values are considered valid.
 */
export type Falsey<T> = { [P in keyof T]?: T[P] | false | null };

/**
 * jsxstyle-compatible CSS properties interface provided by `csstype`.
 *
 * Note: this interface does not support prefixed style props (media query or pseudoclass/pseudoelement).
 * Support for these props can be added as needed with module augmentation. Example:
 *
```typescript
import { CSSProperties } from 'jsxstyle';

declare module 'jsxstyle' {
  interface CSSProperties {
    hoverBackgroundColor: CSSProperties['backgroundColor'];
  }
}
```

 * or if you’re feeling adventurous:

```typescript
import { CSSProperties } from 'jsxstyle';

declare module 'jsxstyle' {
  interface CSSProperties {
    [key: string]: any;
  }
}
```
 * For further reading, see the TypeScript docs: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
 */
export interface CSSProperties extends Falsey<Properties<string | number>> {}
