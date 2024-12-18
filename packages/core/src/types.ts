import type { Properties } from 'csstype';
import type { ShorthandProps } from './parseStyleProps.js';

/**
 * Make all properties in `T` potentially `null` or `false`.
 *
 * Note: `Falsey` is not the best name, as jsxstyle considers zero to be truthy.
 */
export type Falsey<T> = { [P in keyof T]?: T[P] | false | null };

type BaseCSSProperties = Falsey<Properties<string | number>>;

/** Properties that can be animated */
export type AnimatableCSSProperties = Omit<BaseCSSProperties, 'animation'>;

/** Every uppercase letter */
type UpperCaseLetter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

/** Union of patterns that match event handler names. */
export type EventHandlerKeys = `on${UpperCaseLetter}${string}`;

interface JsxstyleAnimation {
  [key: string]: AnimatableCSSProperties;
}

/** Commonly-used pseudo-prefixed style names */
interface PseudoPrefixedProps {
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
  import { CSSProperties } from '@jsxstyle/react';

  declare module '@jsxstyle/react' {
    interface CSSProperties {
      hoverBackgroundColor: CSSProperties['backgroundColor'];
    }
  }
```

 * or if you’re feeling adventurous:

```typescript
  import { CSSProperties } from '@jsxstyle/react';

  declare module '@jsxstyle/react' {
    interface CSSProperties {
      [key: string]: any;
    }
  }
```
 * For further reading, see the TypeScript docs: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
 */
export interface CSSProperties
  extends AnimatableCSSProperties,
    PseudoPrefixedProps,
    ShorthandProps {
  animation?: BaseCSSProperties['animation'] | JsxstyleAnimation;
}

/** Cache object used in `jsxstyle/webpack-plugin` */
export interface CacheObject {
  [key: string]: string;
  [key: symbol]: number;
}
