import { Properties } from 'csstype';

export type Dict<T> = { [key: string]: T };

export type ExactCSSProperties = Properties<string | number>;

// Dict<any> is required until pseudoclass prefixed style props have types
export type CSSProperties = ExactCSSProperties & Dict<any>;
