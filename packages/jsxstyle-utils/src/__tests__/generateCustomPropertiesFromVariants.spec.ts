import { generateCustomPropertiesFromVariants } from '../generateCustomPropertiesFromVariants';

describe('generateCustomPropertiesFromVariants', () => {
  it('works with a single variant', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        exampleNumber: 123,
        exampleString: 'wow',
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleNumber": "var(--jsxstyle-exampleNumber)",
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "overrideClasses": {
          "default": "jsxstyle-override__default",
        },
        "styles": [
          ":root { --jsxstyle-exampleNumber: 123px;--jsxstyle-exampleString: wow; }",
          ":root.jsxstyle-override__default, :root .jsxstyle-override__default { --jsxstyle-exampleNumber: 123px;--jsxstyle-exampleString: wow; }",
        ],
        "variantNames": [
          "default",
        ],
      }
    `);
  });

  it('works with multiple variants', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        exampleNumber: 123,
        exampleString: 'wow',
      },
      exampleVariant: {
        exampleNumber: 456,
        exampleString: 'ok',
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleNumber": "var(--jsxstyle-exampleNumber)",
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "overrideClasses": {
          "default": "jsxstyle-override__default",
          "exampleVariant": "jsxstyle-override__exampleVariant",
        },
        "styles": [
          ":root { --jsxstyle-exampleNumber: 123px;--jsxstyle-exampleString: wow; }",
          ":root.jsxstyle-override__default, :root .jsxstyle-override__default { --jsxstyle-exampleNumber: 123px;--jsxstyle-exampleString: wow; }",
          ":root.jsxstyle-override__exampleVariant, :root .jsxstyle-override__exampleVariant { --jsxstyle-exampleNumber: 456px;--jsxstyle-exampleString: ok; }",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
      }
    `);
  });

  it('works with no styles for some reason', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {},
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {},
        "overrideClasses": {
          "default": "jsxstyle-override__default",
        },
        "styles": [
          ":root {  }",
          ":root.jsxstyle-override__default, :root .jsxstyle-override__default {  }",
        ],
        "variantNames": [
          "default",
        ],
      }
    `);
  });

  it('allows a custom namespace to be set', () => {
    const example = generateCustomPropertiesFromVariants(
      {
        default: {
          exampleNumber: 123,
          exampleString: 'wow',
        },
        exampleVariant: {
          exampleNumber: 456,
          exampleString: 'ok',
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
        "overrideClasses": {
          "default": "exampleNamespace-override__default",
          "exampleVariant": "exampleNamespace-override__exampleVariant",
        },
        "styles": [
          ":root { --exampleNamespace-exampleNumber: 123px;--exampleNamespace-exampleString: wow; }",
          ":root.exampleNamespace-override__default, :root .exampleNamespace-override__default { --exampleNamespace-exampleNumber: 123px;--exampleNamespace-exampleString: wow; }",
          ":root.exampleNamespace-override__exampleVariant, :root .exampleNamespace-override__exampleVariant { --exampleNamespace-exampleNumber: 456px;--exampleNamespace-exampleString: ok; }",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
      }
    `);
  });

  it('mangles custom property names when the mangle option is enabled', () => {
    const example = generateCustomPropertiesFromVariants(
      {
        default: {
          exampleNumber: 123,
          exampleString: 'wow',
        },
        exampleVariant: {
          exampleString: 'ok',
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
        "overrideClasses": {
          "default": "x-override__default",
          "exampleVariant": "x-override__exampleVariant",
        },
        "styles": [
          ":root { --x0: 123px;--x1: wow; }",
          ":root.x-override__default, :root .x-override__default { --x0: 123px;--x1: wow; }",
          ":root.x-override__exampleVariant, :root .x-override__exampleVariant { --x1: ok; }",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
      }
    `);
  });

  it('allows a custom selector to be set', () => {
    const example = generateCustomPropertiesFromVariants(
      {
        default: {
          exampleString: 'wow',
        },
        exampleVariant: {
          exampleString: 'ok',
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
        "overrideClasses": {
          "default": "jsxstyle-override__default",
          "exampleVariant": "jsxstyle-override__exampleVariant",
        },
        "styles": [
          "#test { --jsxstyle-exampleString: wow; }",
          "#test.jsxstyle-override__default, #test .jsxstyle-override__default { --jsxstyle-exampleString: wow; }",
          "#test.jsxstyle-override__exampleVariant, #test .jsxstyle-override__exampleVariant { --jsxstyle-exampleString: ok; }",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
      }
    `);
  });

  it('makes use of the mediaQuery prop', () => {
    const example = generateCustomPropertiesFromVariants({
      default: {
        exampleString: 'wow',
      },
      exampleVariant: {
        mediaQuery: 'screen and example-media-query',
        exampleString: 'ok',
      },
    });

    expect(example).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "exampleString": "var(--jsxstyle-exampleString)",
        },
        "overrideClasses": {
          "default": "jsxstyle-override__default",
          "exampleVariant": "jsxstyle-override__exampleVariant",
        },
        "styles": [
          ":root { --jsxstyle-exampleString: wow; }",
          "@media screen and example-media-query { :root { --jsxstyle-exampleString: ok; } }",
          ":root.jsxstyle-override__default, :root .jsxstyle-override__default { --jsxstyle-exampleString: wow; }",
          ":root.jsxstyle-override__exampleVariant, :root .jsxstyle-override__exampleVariant { --jsxstyle-exampleString: ok; }",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
        ],
      }
    `);
  });
});
