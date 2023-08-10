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
  it('works', () => {
    const example = makeCustomProperties({
      exampleNumber: 123,
      exampleString: 'wow',
    })
      .addVariant('exampleVariant', {
        exampleString: 'variantWow',
      })
      .addVariant('variantWithMQ', {
        mediaQuery: 'screen and example',
        exampleNumber: 456,
      })
      .build({
        mangle: true,
        namespace: 'exampleNamespace',
        selector: '#banana',
      });

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [],
          "text": "/* jsxstyle */",
        },
        {
          "styles": [
            "#banana {--exampleNamespace0: 123px; --exampleNamespace1: wow;}",
            "@media screen and example {#banana {--exampleNamespace0: 456px;}}",
            "#banana.exampleNamespace-override__default, #banana .exampleNamespace-override__default {--exampleNamespace0: 123px; --exampleNamespace1: wow;}",
            "#banana.exampleNamespace-override__exampleVariant, #banana .exampleNamespace-override__exampleVariant {--exampleNamespace1: variantWow;}",
            "#banana.exampleNamespace-override__variantWithMQ, #banana .exampleNamespace-override__variantWithMQ {--exampleNamespace0: 456px;}",
          ],
          "text": "/* jsxstyle custom properties */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "activateDefault": [Function],
        "activateExampleVariant": [Function],
        "activateVariantWithMQ": [Function],
        "exampleNumber": "var(--exampleNamespace0)",
        "exampleString": "var(--exampleNamespace1)",
        "reset": [Function],
        "setVariant": [Function],
        "variants": [
          "default",
          "exampleVariant",
          "variantWithMQ",
        ],
      }
    `);
    example.reset();
  });
});
