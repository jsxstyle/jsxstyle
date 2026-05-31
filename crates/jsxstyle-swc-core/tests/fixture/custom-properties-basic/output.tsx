import { makeCustomProperties } from '@jsxstyle/react';
const props = {
    prop1: "var(--jsxstyle-prop1)",
    prop2: "var(--jsxstyle-prop2)",
    variantNames: [
        "default",
        "banana"
    ],
    variants: {
        default: {
            className: "jsxstyle_default"
        },
        banana: {
            className: "jsxstyle_banana",
            mediaQuery: "@media mq"
        }
    },
    styles: [
        ":root{--jsxstyle-prop1:prop1 value;--jsxstyle-prop2:123px}",
        ":root:not(.\\9).jsxstyle_default{--jsxstyle-prop1:prop1 value;--jsxstyle-prop2:123px}",
        ":root:not(.\\9).jsxstyle_banana{--jsxstyle-prop1:banana prop1 value}",
        "@media mq{:root:not(.\\9){--jsxstyle-prop1:banana prop1 value}}"
    ]
};
