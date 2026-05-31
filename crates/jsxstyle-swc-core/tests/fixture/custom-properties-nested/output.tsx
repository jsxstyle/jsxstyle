import { makeCustomProperties } from '@jsxstyle/react';
const props = {
    prop1: "var(--test0)",
    prop2: "var(--test1)",
    nested: {
        prop3: "var(--test2)",
        nested2: {
            prop4: "var(--test3)"
        }
    },
    variantNames: [
        "default",
        "banana"
    ],
    variants: {
        default: {
            className: "test_default"
        },
        banana: {
            className: "test_banana",
            mediaQuery: "@media mq"
        }
    },
    styles: [
        ":root{--test0:prop1 value;--test1:123px;--test2:nested prop3 value;--test3:nested2 prop4 value}",
        ":root:not(.\\9).test_default{--test0:prop1 value;--test1:123px;--test2:nested prop3 value;--test3:nested2 prop4 value}",
        ":root:not(.\\9).test_banana{--test0:banana prop1 value;--test3:banana nested2 prop4 value}",
        "@media mq{:root:not(.\\9){--test0:banana prop1 value;--test3:banana nested2 prop4 value}}"
    ]
};
