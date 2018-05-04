import { Properties } from 'csstype';

export interface Dict<T> {
  [key: string]: T;
}

/** Make all properties in T potentially falsey */
export type Falsey<T> = { [P in keyof T]?: T[P] | false | null };

/**
 * jsxstyle-compatible CSS properties provided by csstype.
 *
 * Use this type instead of `CSSProperties` if you don't use pseudoelement, pseudoclass, or media query props with jsxstyle.
 */
export type ExactCSSProperties = Falsey<Properties<string | number>>;

/**
 * jsxstyle-compatible CSS properties provided by csstype with an additional string index signature.
 *
 * Use this type instead of `ExactCSSProperties` if you use pseudoelement, pseudoclass, or media query props with jsxstyle.
 */
export type CSSProperties = ExactCSSProperties & Dict<any>;
