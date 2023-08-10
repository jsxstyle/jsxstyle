/** @jest-environment jsdom */

import { makeCustomProperties } from '../makeCustomProperties';

const getStyleSheetContents = () => {
  return Array.from(document.querySelectorAll('style')).map((node) => {
    return {
      text: node.innerHTML,
      styles: Array.from(node.sheet!.cssRules).map((rule) => rule.cssText),
    };
  });
};

describe('makeCustomProperties', () => {
  it('works with a single variant', () => {
    const example = makeCustomProperties({
      exampleNumber: 123,
      exampleString: 'wow',
    }).build();

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [],
          "text": "/* jsxstyle */",
        },
        {
          "styles": [
            ":root {--jsxstyle-exampleNumber: 123px; --jsxstyle-exampleString: wow;}",
            ":root.jsxstyle-override__default, :root .jsxstyle-override__default {--jsxstyle-exampleNumber: 123px; --jsxstyle-exampleString: wow;}",
          ],
          "text": "/* jsxstyle custom properties */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "exampleNumber": "var(--jsxstyle-exampleNumber)",
        "exampleString": "var(--jsxstyle-exampleString)",
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
        ],
      }
    `);
    example.reset();
  });

  it('works with multiple variants', () => {
    const example = makeCustomProperties({
      exampleNumber: 123,
      exampleString: 'wow',
    })
      .addVariant('exampleVariant', {
        exampleNumber: 456,
        exampleString: 'ok',
      })
      .build();

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "activateExampleVariant": [Function],
        "exampleNumber": "var(--jsxstyle-exampleNumber)",
        "exampleString": "var(--jsxstyle-exampleString)",
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
          "exampleVariant",
        ],
      }
    `);
    example.reset();
  });

  it('works with no styles for some reason', () => {
    const example = makeCustomProperties({}).build();

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [],
          "text": "/* jsxstyle */",
        },
        {
          "styles": [
            ":root {}",
            ":root.jsxstyle-override__default, :root .jsxstyle-override__default {}",
          ],
          "text": "/* jsxstyle custom properties */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
        ],
      }
    `);
    example.reset();
  });

  it('allows a custom namespace to be set', () => {
    const example = makeCustomProperties({
      exampleNumber: 123,
      exampleString: 'wow',
    })
      .addVariant('exampleVariant', {
        exampleNumber: 456,
        exampleString: 'ok',
      })
      .build({
        namespace: 'exampleNamespace',
      });

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [],
          "text": "/* jsxstyle */",
        },
        {
          "styles": [
            ":root {--exampleNamespace-exampleNumber: 123px; --exampleNamespace-exampleString: wow;}",
            ":root.exampleNamespace-override__default, :root .exampleNamespace-override__default {--exampleNamespace-exampleNumber: 123px; --exampleNamespace-exampleString: wow;}",
            ":root.exampleNamespace-override__exampleVariant, :root .exampleNamespace-override__exampleVariant {--exampleNamespace-exampleNumber: 456px; --exampleNamespace-exampleString: ok;}",
          ],
          "text": "/* jsxstyle custom properties */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "activateExampleVariant": [Function],
        "exampleNumber": "var(--exampleNamespace-exampleNumber)",
        "exampleString": "var(--exampleNamespace-exampleString)",
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
          "exampleVariant",
        ],
      }
    `);
    example.reset();
  });

  it('mangles custom property names when the mangle option is enabled', () => {
    const example = makeCustomProperties({
      exampleNumber: 123,
      exampleString: 'wow',
    })
      .addVariant('exampleVariant', {
        exampleString: 'ok',
      })
      .build({
        namespace: 'x',
        mangle: true,
      });

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [],
          "text": "/* jsxstyle */",
        },
        {
          "styles": [
            ":root {--x0: 123px; --x1: wow;}",
            ":root.x-override__default, :root .x-override__default {--x0: 123px; --x1: wow;}",
            ":root.x-override__exampleVariant, :root .x-override__exampleVariant {--x1: ok;}",
          ],
          "text": "/* jsxstyle custom properties */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "activateExampleVariant": [Function],
        "exampleNumber": "var(--x2)",
        "exampleString": "var(--x1)",
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
          "exampleVariant",
        ],
      }
    `);
    example.reset();
  });

  it('allows a custom selector to be set', () => {
    const example = makeCustomProperties({
      exampleString: 'wow',
    })
      .addVariant('exampleVariant', {
        exampleString: 'ok',
      })
      .build({
        selector: '#test',
      });

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [],
          "text": "/* jsxstyle */",
        },
        {
          "styles": [
            "#test {--jsxstyle-exampleString: wow;}",
            "#test.jsxstyle-override__default, #test .jsxstyle-override__default {--jsxstyle-exampleString: wow;}",
            "#test.jsxstyle-override__exampleVariant, #test .jsxstyle-override__exampleVariant {--jsxstyle-exampleString: ok;}",
          ],
          "text": "/* jsxstyle custom properties */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "activateExampleVariant": [Function],
        "exampleString": "var(--jsxstyle-exampleString)",
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
          "exampleVariant",
        ],
      }
    `);
    example.reset();
  });

  it('makes use of the mediaQuery prop', () => {
    const example = makeCustomProperties({
      exampleString: 'wow',
    })
      .addVariant('exampleVariant', {
        mediaQuery: 'screen and example-media-query',
        exampleString: 'ok',
      })
      .build();

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [],
          "text": "/* jsxstyle */",
        },
        {
          "styles": [
            ":root {--jsxstyle-exampleString: wow;}",
            "@media screen and example-media-query {:root {--jsxstyle-exampleString: ok;}}",
            ":root.jsxstyle-override__default, :root .jsxstyle-override__default {--jsxstyle-exampleString: wow;}",
            ":root.jsxstyle-override__exampleVariant, :root .jsxstyle-override__exampleVariant {--jsxstyle-exampleString: ok;}",
          ],
          "text": "/* jsxstyle custom properties */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "activateExampleVariant": [Function],
        "exampleString": "var(--jsxstyle-exampleString)",
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
          "exampleVariant",
        ],
      }
    `);
    example.reset();
  });
});
