import { Properties } from 'csstype';

export type Dict<T> = { [key: string]: T };

// Dict<any> is required until pseudoclass prefixed style props have types
export type CSSProperties = Properties<string | number> & Dict<any>;
