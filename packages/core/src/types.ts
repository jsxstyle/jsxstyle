import type { Properties } from 'csstype';
import type { ShorthandProps } from './parseStyleProp.js';

/**
 * Make all properties in `T` potentially `null` or `false`.
 *
 * Note: `Falsey` is not the best name, as jsxstyle considers zero to be truthy.
 */
export type Falsey<T> = { [P in keyof T]?: T[P] | false | null };

/** The CSS property type from `csstype`, configured for jsxstyle */
export type CSSProperties = Falsey<Properties<string | number>>;

/** All CSS properties minus `animation` */
export type CSSPropertiesWithoutAnimation = Omit<CSSProperties, 'animation'>;

/** CSS properties that can be animated */
interface AnimatableStyleProps extends CSSProperties, ShorthandProps {}

/**
 * An object of style objects keyed by animation step.
 *
 * Example:
 *
 * ```tsx
 * <Block
 *   animation={{
 *     from: { opacity: 0 },
 *     to: { opacity: 1 },
 *   }}
 *   animationDuration="200ms"
 *   animationTimingFunction="ease-in-out"
 * />
 * ```
 */
export interface JsxstyleAnimation {
  [step: string]: AnimatableStyleProps;
}

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

/**
 * Commonly-used pseudo-prefixed style names
 * Note: this interface does not support all prefixed style props (media query or pseudoclass/pseudoelement).
 * Support for these props can be added as needed with module augmentation. Example:
 *
 * ```typescript
 * import { PseudoPrefixedProps, CSSProperties } from '@jsxstyle/core';
 *
 * declare module '@jsxstyle/core' {
 *   interface PseudoPrefixedProps {
 *     hoverBackgroundColor: CSSProperties['backgroundColor'];
 *   }
 * }
 * ```
 *
 * or if you’re feeling adventurous:
 *
 * ```typescript
 * import { PseudoPrefixedProps } from '@jsxstyle/core';
 *
 * declare module '@jsxstyle/core' {
 *   interface PseudoPrefixedProps {
 *     [key: string]: any;
 *   }
 * }
 * ```
 * For further reading, see the TypeScript docs: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
 */
export interface PseudoPrefixedProps {
  activeOpacity?: CSSProperties['opacity'];
  disabledOpacity?: CSSProperties['opacity'];
  focusOpacity?: CSSProperties['opacity'];
  hoverOpacity?: CSSProperties['opacity'];

  activeColor?: CSSProperties['color'];
  hoverColor?: CSSProperties['color'];

  activeBackgroundColor?: CSSProperties['backgroundColor'];
  focusBackgroundColor?: CSSProperties['backgroundColor'];
  hoverBackgroundColor?: CSSProperties['backgroundColor'];

  hoverTextDecoration?: CSSProperties['textDecoration'];
  hoverTextDecorationColor?: CSSProperties['textDecorationColor'];

  activeBoxShadow?: CSSProperties['boxShadow'];
  focusBoxShadow?: CSSProperties['boxShadow'];
  hoverBoxShadow?: CSSProperties['boxShadow'];

  placeholderColor?: CSSProperties['color'];
  disabledPlaceholderColor?: CSSProperties['color'];
  focusPlaceholderColor?: CSSProperties['color'];

  selectionColor?: CSSProperties['color'];
  selectionBackgroundColor?: CSSProperties['backgroundColor'];
}

export interface MakeComponentCustomPropCSSProperties
  extends CSSPropertiesWithoutAnimation,
    PseudoPrefixedProps,
    ShorthandProps {
  animation?: CSSProperties['animation'] | JsxstyleAnimation;
}

/**
 * All style props that can be passed to a jsxstyle component.
 */
export interface JsxstyleComponentStyleProps
  extends CSSPropertiesWithoutAnimation,
    PseudoPrefixedProps,
    ShorthandProps,
    AmpersandStyles {
  animation?: CSSProperties['animation'] | JsxstyleAnimation;
  [key: `@container ${string}`]: ValidContainerQueryStyleProps;
  [key: `@media ${string}`]: ValidMediaQueryStyleProps;
}

/**
 * An object of CSS property objects keyed by selector string.
 * The selector must contain at least one ampersand.
 *
 * Every ampersand is replaced with the generated class name selector.
 */
interface AmpersandStyles {
  [key: `${string}&${string}`]: JsxstyleComponentStyleProps;
}

/** Style props that can be nested inside a `@container` */
interface ValidContainerQueryStyleProps
  extends CSSProperties,
    PseudoPrefixedProps,
    ShorthandProps,
    AmpersandStyles {}

/** Style props that can be nested inside a media query */
interface ValidMediaQueryStyleProps
  extends CSSProperties,
    PseudoPrefixedProps,
    ShorthandProps,
    AmpersandStyles {}

/** Cache object used in jsxstyle bundler plugins */
export interface CacheObject {
  [key: string]: string;
  [key: symbol]: number;
}
