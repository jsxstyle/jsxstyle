import { Properties } from 'csstype';

/**
 * Make all properties in `T` potentially `null` or `false`.
 *
 * Note: `Falsey` is not the best name, as jsxstyle considers zero to be truthy.
 */
export type Falsey<T> = { [P in keyof T]?: T[P] | false | null };

type BaseCSSProperties = Properties<string | number>;

interface CSSPropsInternal extends BaseCSSProperties {
  // jsxstyle-only shorthand props
  marginH?: BaseCSSProperties['margin'];
  marginV?: BaseCSSProperties['margin'];
  paddingH?: BaseCSSProperties['padding'];
  paddingV?: BaseCSSProperties['padding'];

  // commonly used pseudo-prefixed style names
  activeOpacity?: BaseCSSProperties['opacity'];
  disabledOpacity?: BaseCSSProperties['opacity'];
  focusOpacity?: BaseCSSProperties['opacity'];
  hoverOpacity?: BaseCSSProperties['opacity'];

  activeColor?: BaseCSSProperties['color'];
  hoverColor?: BaseCSSProperties['color'];

  activeBackgroundColor?: BaseCSSProperties['backgroundColor'];
  focusBackgroundColor?: BaseCSSProperties['backgroundColor'];
  hoverBackgroundColor?: BaseCSSProperties['backgroundColor'];

  hoverTextDecoration?: BaseCSSProperties['textDecoration'];
  hoverTextDecorationColor?: BaseCSSProperties['textDecorationColor'];

  activeBoxShadow?: BaseCSSProperties['boxShadow'];
  focusBoxShadow?: BaseCSSProperties['boxShadow'];
  hoverBoxShadow?: BaseCSSProperties['boxShadow'];

  placeholderColor?: BaseCSSProperties['color'];
  disabledPlaceholderColor?: BaseCSSProperties['color'];
  focusPlaceholderColor?: BaseCSSProperties['color'];

  selectionColor?: BaseCSSProperties['color'];
  selectionBackgroundColor?: BaseCSSProperties['backgroundColor'];
}

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
export interface CSSProperties extends Falsey<CSSPropsInternal> {}
