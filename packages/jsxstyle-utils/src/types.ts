import { Properties } from 'csstype';

import { pseudoclasses, pseudoelements } from './getStyleKeysForProps';

/**
 * Make all properties in `T` potentially `null` or `false`.
 *
 * Note: `Falsey` is not the best name, as jsxstyle considers zero to be truthy.
 */
export type Falsey<T> = { [P in keyof T]?: T[P] | false | null };

type BaseCSSProperties = Properties<string | number>;

interface JsxstyleAnimation {
  // Prefixes on animation styles are not currently supported
  [key: string]: BaseCSSProperties;
}

type Pseudoelements = keyof typeof pseudoelements;
type Pseudoclasses = keyof typeof pseudoclasses;
type PrefixString<P extends string, K extends string> = `${P}${K}`;
type PrefixKeys<P extends string, T> = {
  [K in keyof T as PrefixString<P, Capitalize<Extract<K, string>>>]: T[K];
};

type CSSPropsPseudoelements = PrefixKeys<Pseudoelements, BaseCSSProperties>;
type CSSPropsPseudoclasses = PrefixKeys<
  Pseudoclasses,
  BaseCSSProperties & CSSPropsPseudoelements
>;

interface CSSPropsInternal
  extends Omit<BaseCSSProperties, 'animation'>,
    CSSPropsPseudoelements,
    CSSPropsPseudoclasses {
  // custom animation prop
  animation?: BaseCSSProperties['animation'] | JsxstyleAnimation;

  // jsxstyle-only shorthand props
  marginH?: BaseCSSProperties['margin'];
  marginV?: BaseCSSProperties['margin'];
  paddingH?: BaseCSSProperties['padding'];
  paddingV?: BaseCSSProperties['padding'];
}

export interface CSSProperties extends Falsey<CSSPropsInternal> {}
