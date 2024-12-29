import { generateCustomPropertiesFromVariants } from '../generateCustomPropertiesFromVariants';

describe('generateCustomPropertiesFromVariants', () => {
  it('works with a single variant', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        props: {
          exampleNumber: 123,
          exampleString: 'wow',
        },
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleNumber": "var(--jsxstyle-exampleNumber)",
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "styles": [
          ":root{--jsxstyle-exampleNumber:123px;--jsxstyle-exampleString:wow}",
          ":root:not(.\\9).jsxstyle_default{--jsxstyle-exampleNumber:123px;--jsxstyle-exampleString:wow}",
        ],
        "variantNames": [
          "default",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
        },
      }
    `);
  });

  it('works with multiple variants', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        props: {
          exampleNumber: 123,
          exampleString: 'wow',
        },
      },
      exampleVariant: {
        props: {
          exampleNumber: 456,
          exampleString: 'ok',
        },
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleNumber": "var(--jsxstyle-exampleNumber)",
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "styles": [
          ":root{--jsxstyle-exampleNumber:123px;--jsxstyle-exampleString:wow}",
          ":root:not(.\\9).jsxstyle_default{--jsxstyle-exampleNumber:123px;--jsxstyle-exampleString:wow}",
          ":root:not(.\\9).jsxstyle_exampleVariant{--jsxstyle-exampleNumber:456px;--jsxstyle-exampleString:ok}",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
          "exampleVariant": {
            "className": "jsxstyle_exampleVariant",
          },
        },
      }
    `);
  });

  it('works with no styles for some reason', () => {
    const example = generateCustomPropertiesFromVariants({
      default: { props: {} },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {},
        "styles": [
          ":root{}",
          ":root:not(.\\9).jsxstyle_default{}",
        ],
        "variantNames": [
          "default",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
        },
      }
    `);
  });

  it('allows a custom namespace to be set', () => {
    const example = generateCustomPropertiesFromVariants(
      {
        default: {
          props: {
            exampleNumber: 123,
            exampleString: 'wow',
          },
        },
        exampleVariant: {
          props: {
            exampleNumber: 456,
            exampleString: 'ok',
          },
        },
      },
      {
        namespace: 'exampleNamespace',
      }
    );

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleNumber": "var(--exampleNamespace-exampleNumber)",
          "exampleString": "var(--exampleNamespace-exampleString)",
        },
        "styles": [
          ":root{--exampleNamespace-exampleNumber:123px;--exampleNamespace-exampleString:wow}",
          ":root:not(.\\9).exampleNamespace_default{--exampleNamespace-exampleNumber:123px;--exampleNamespace-exampleString:wow}",
          ":root:not(.\\9).exampleNamespace_exampleVariant{--exampleNamespace-exampleNumber:456px;--exampleNamespace-exampleString:ok}",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
        "variants": {
          "default": {
            "className": "exampleNamespace_default",
            "mediaQuery": undefined,
          },
          "exampleVariant": {
            "className": "exampleNamespace_exampleVariant",
          },
        },
      }
    `);
  });

  it('mangles custom property names when the mangle option is enabled', () => {
    const example = generateCustomPropertiesFromVariants(
      {
        default: {
          props: {
            exampleNumber: 123,
            exampleString: 'wow',
          },
        },
        exampleVariant: {
          props: {
            exampleString: 'ok',
          },
        },
      },
      {
        namespace: 'x',
        mangle: true,
      }
    );

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleNumber": "var(--x0)",
          "exampleString": "var(--x1)",
        },
        "styles": [
          ":root{--x0:123px;--x1:wow}",
          ":root:not(.\\9).x_default{--x0:123px;--x1:wow}",
          ":root:not(.\\9).x_exampleVariant{--x1:ok}",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
        "variants": {
          "default": {
            "className": "x_default",
            "mediaQuery": undefined,
          },
          "exampleVariant": {
            "className": "x_exampleVariant",
          },
        },
      }
    `);
  });

  it('allows a custom selector to be set', () => {
    const example = generateCustomPropertiesFromVariants(
      {
        default: {
          props: {
            exampleString: 'wow',
          },
        },
        exampleVariant: {
          props: {
            exampleString: 'ok',
          },
        },
      },
      {
        selector: '#test',
      }
    );

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "styles": [
          "#test{--jsxstyle-exampleString:wow}",
          "#test:not(.\\9).jsxstyle_default{--jsxstyle-exampleString:wow}",
          "#test:not(.\\9).jsxstyle_exampleVariant{--jsxstyle-exampleString:ok}",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
          "exampleVariant": {
            "className": "jsxstyle_exampleVariant",
          },
        },
      }
    `);
  });

  it('handles the colorScheme prop', () => {
    const example = generateCustomPropertiesFromVariants({
      default: { props: { color: 'black' } },
      darkMode: { props: { color: 'white' }, options: { colorScheme: 'dark' } },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "color": "var(--jsxstyle-color)",
        },
        "styles": [
          ":root{--jsxstyle-color:black}",
          ":root:not(.\\9).jsxstyle_default{--jsxstyle-color:black}",
          ":root:not(.\\9).jsxstyle_darkMode{color-scheme:dark;--jsxstyle-color:white}",
        ],
        "variantNames": [
          "default",
          "darkMode",
        ],
        "variants": {
          "darkMode": {
            "className": "jsxstyle_darkMode",
          },
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
        },
      }
    `);
  });

  it('handles a solitary colorScheme prop in the second variant', () => {
    const example = generateCustomPropertiesFromVariants({
      default: { props: { color: 'black' } },
      darkMode: { options: { colorScheme: 'dark' }, props: {} },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "color": "var(--jsxstyle-color)",
        },
        "styles": [
          ":root{--jsxstyle-color:black}",
          ":root:not(.\\9).jsxstyle_default{--jsxstyle-color:black}",
          ":root:not(.\\9).jsxstyle_darkMode{color-scheme:dark}",
        ],
        "variantNames": [
          "default",
          "darkMode",
        ],
        "variants": {
          "darkMode": {
            "className": "jsxstyle_darkMode",
          },
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
        },
      }
    `);
  });

  it('handles a solitary colorScheme prop', () => {
    const example = generateCustomPropertiesFromVariants({
      default: { options: { colorScheme: 'light' }, props: {} },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {},
        "styles": [
          ":root{color-scheme:light}",
          ":root:not(.\\9).jsxstyle_default{color-scheme:light}",
        ],
        "variantNames": [
          "default",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
        },
      }
    `);
  });

  it('makes use of the mediaQuery prop', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        props: { exampleString: 'wow' },
      },
      exampleVariant: {
        props: { exampleString: 'ok' },
        options: { mediaQuery: 'screen and example-media-query' },
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "styles": [
          ":root{--jsxstyle-exampleString:wow}",
          ":root:not(.\\9).jsxstyle_default{--jsxstyle-exampleString:wow}",
          ":root:not(.\\9).jsxstyle_exampleVariant{--jsxstyle-exampleString:ok}",
          "@media screen and example-media-query{:root:not(.\\9){--jsxstyle-exampleString:ok}}",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": undefined,
          },
          "exampleVariant": {
            "className": "jsxstyle_exampleVariant",
            "mediaQuery": "@media screen and example-media-query",
          },
        },
      }
    `);
  });

  it('works with initial media queries', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        props: { exampleString: 'wow' },
        options: { mediaQuery: 'screen and example-media-query' },
      },
      exampleVariant: {
        props: { exampleString: 'ok' },
        options: { mediaQuery: 'screen and example-media-query' },
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "styles": [
          ":root{--jsxstyle-exampleString:wow}",
          ":root:not(.\\9).jsxstyle_default{--jsxstyle-exampleString:wow}",
          "@media screen and example-media-query{:root:not(.\\9){--jsxstyle-exampleString:wow}}",
          ":root:not(.\\9).jsxstyle_exampleVariant{--jsxstyle-exampleString:ok}",
          "@media screen and example-media-query{:root:not(.\\9){--jsxstyle-exampleString:ok}}",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": "@media screen and example-media-query",
          },
          "exampleVariant": {
            "className": "jsxstyle_exampleVariant",
            "mediaQuery": "@media screen and example-media-query",
          },
        },
      }
    `);
  });

  it('works with nested custom props objects', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        props: {
          exampleString: 'wow',
          nested: {
            exampleString: 'wow',
            nested: {
              exampleString: 'wow',
            },
          },
        },
        options: {
          mediaQuery: 'screen and default-media-query',
        },
      },
      exampleVariant: {
        props: {
          exampleString: 'ok',
          nested: {
            exampleString: 'ok',
            nested: {
              exampleString: 'ok',
            },
          },
        },
        options: {
          mediaQuery: 'screen and example-media-query',
        },
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleString": "var(--jsxstyle-exampleString)",
          "nested": {
            "exampleString": "var(--jsxstyle-nested-exampleString)",
            "nested": {
              "exampleString": "var(--jsxstyle-nested-nested-exampleString)",
            },
          },
        },
        "styles": [
          ":root{--jsxstyle-exampleString:wow;--jsxstyle-nested-exampleString:wow;--jsxstyle-nested-nested-exampleString:wow}",
          ":root:not(.\\9).jsxstyle_default{--jsxstyle-exampleString:wow;--jsxstyle-nested-exampleString:wow;--jsxstyle-nested-nested-exampleString:wow}",
          "@media screen and default-media-query{:root:not(.\\9){--jsxstyle-exampleString:wow;--jsxstyle-nested-exampleString:wow;--jsxstyle-nested-nested-exampleString:wow}}",
          ":root:not(.\\9).jsxstyle_exampleVariant{--jsxstyle-exampleString:ok;--jsxstyle-nested-exampleString:ok;--jsxstyle-nested-nested-exampleString:ok}",
          "@media screen and example-media-query{:root:not(.\\9){--jsxstyle-exampleString:ok;--jsxstyle-nested-exampleString:ok;--jsxstyle-nested-nested-exampleString:ok}}",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
        "variants": {
          "default": {
            "className": "jsxstyle_default",
            "mediaQuery": "@media screen and default-media-query",
          },
          "exampleVariant": {
            "className": "jsxstyle_exampleVariant",
            "mediaQuery": "@media screen and example-media-query",
          },
        },
      }
    `);
  });
});
