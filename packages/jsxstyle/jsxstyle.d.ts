/// <reference types="react" />
import * as React from 'react';
import { StyleCache } from 'jsxstyle-utils/src/getStyleCache';
export declare const cache: StyleCache;
export interface JsxstyleProps {
    className?: string;
    component?: string | React.ComponentClass | React.SFC;
    mediaQueries?: {
        [key: string]: string;
    };
    props?: {
        [key: string]: any;
    };
    style?: React.CSSProperties;
}
export declare const Box: {
    new (props: JsxstyleProps): {
        component: string | React.ComponentClass<{}> | React.StatelessComponent<{}>;
        className: string;
        componentWillReceiveProps(props: JsxstyleProps): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: JsxstyleProps & {
            [key: string]: any;
        }) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<JsxstyleProps & {
            [key: string]: any;
        }>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    defaultProps: {
        [key: string]: React.ReactText;
    } | null | undefined;
    displayName: string;
};
export declare const Block: {
    new (props: JsxstyleProps): {
        component: string | React.ComponentClass<{}> | React.StatelessComponent<{}>;
        className: string;
        componentWillReceiveProps(props: JsxstyleProps): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: JsxstyleProps & {
            [key: string]: any;
        }) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<JsxstyleProps & {
            [key: string]: any;
        }>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    defaultProps: {
        [key: string]: React.ReactText;
    } | null | undefined;
    displayName: string;
};
export declare const Inline: {
    new (props: JsxstyleProps): {
        component: string | React.ComponentClass<{}> | React.StatelessComponent<{}>;
        className: string;
        componentWillReceiveProps(props: JsxstyleProps): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: JsxstyleProps & {
            [key: string]: any;
        }) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<JsxstyleProps & {
            [key: string]: any;
        }>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    defaultProps: {
        [key: string]: React.ReactText;
    } | null | undefined;
    displayName: string;
};
export declare const InlineBlock: {
    new (props: JsxstyleProps): {
        component: string | React.ComponentClass<{}> | React.StatelessComponent<{}>;
        className: string;
        componentWillReceiveProps(props: JsxstyleProps): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: JsxstyleProps & {
            [key: string]: any;
        }) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<JsxstyleProps & {
            [key: string]: any;
        }>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    defaultProps: {
        [key: string]: React.ReactText;
    } | null | undefined;
    displayName: string;
};
export declare const Row: {
    new (props: JsxstyleProps): {
        component: string | React.ComponentClass<{}> | React.StatelessComponent<{}>;
        className: string;
        componentWillReceiveProps(props: JsxstyleProps): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: JsxstyleProps & {
            [key: string]: any;
        }) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<JsxstyleProps & {
            [key: string]: any;
        }>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    defaultProps: {
        [key: string]: React.ReactText;
    } | null | undefined;
    displayName: string;
};
export declare const Col: {
    new (props: JsxstyleProps): {
        component: string | React.ComponentClass<{}> | React.StatelessComponent<{}>;
        className: string;
        componentWillReceiveProps(props: JsxstyleProps): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: JsxstyleProps & {
            [key: string]: any;
        }) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<JsxstyleProps & {
            [key: string]: any;
        }>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    defaultProps: {
        [key: string]: React.ReactText;
    } | null | undefined;
    displayName: string;
};
export declare const Grid: {
    new (props: JsxstyleProps): {
        component: string | React.ComponentClass<{}> | React.StatelessComponent<{}>;
        className: string;
        componentWillReceiveProps(props: JsxstyleProps): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: JsxstyleProps & {
            [key: string]: any;
        }) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<JsxstyleProps & {
            [key: string]: any;
        }>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    defaultProps: {
        [key: string]: React.ReactText;
    } | null | undefined;
    displayName: string;
};
export declare function install(): void;
export declare const Table: {
    new (props: {}, context?: any): {
        componentWillMount(): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: {}) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<{}>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    displayName: string;
    defaultProps: {};
};
export declare const TableRow: {
    new (props: {}, context?: any): {
        componentWillMount(): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: {}) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<{}>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    displayName: string;
    defaultProps: {};
};
export declare const TableCell: {
    new (props: {}, context?: any): {
        componentWillMount(): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: {}) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<{}>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    displayName: string;
    defaultProps: {};
};
export declare const Flex: {
    new (props: {}, context?: any): {
        componentWillMount(): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: {}) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<{}>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    displayName: string;
    defaultProps: {};
};
export declare const InlineFlex: {
    new (props: {}, context?: any): {
        componentWillMount(): void;
        render(): JSX.Element;
        setState<K extends never>(f: (prevState: Readonly<{}>, props: {}) => Pick<{}, K>, callback?: (() => any) | undefined): void;
        setState<K extends never>(state: Pick<{}, K>, callback?: (() => any) | undefined): void;
        forceUpdate(callBack?: (() => any) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<{}>;
        state: Readonly<{}>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    displayName: string;
    defaultProps: {};
};
