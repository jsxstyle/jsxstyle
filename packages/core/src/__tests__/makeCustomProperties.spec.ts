/** @vitest-environment jsdom */
/// <reference lib="dom" />

import { getStyleCache } from '../getStyleCache';
import { getCustomPropertiesFunction } from '../makeCustomProperties';

const cache = getStyleCache();
const makeCustomProperties = getCustomPropertiesFunction(cache);

const getStyleSheetContents = () => {
  return Array.from(document.querySelectorAll('style')).map((node) => {
    return {
      text: node.innerHTML,
      styles: node.sheet?.cssRules
        ? Array.from(node.sheet.cssRules).map((rule) => rule.cssText)
        : null,
    };
  });
};

describe('makeCustomProperties', () => {
  it('works', () => {
    const banana = document.createElement('div');
    banana.id = 'banana';
    document.body.appendChild(banana);

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
          "styles": [
            "#banana {--exampleNamespace0: 123px; --exampleNamespace1: wow;}",
            "#banana:not(.\\9).exampleNamespace_default {--exampleNamespace0: 123px; --exampleNamespace1: wow;}",
            "#banana:not(.\\9).exampleNamespace_exampleVariant {--exampleNamespace1: variantWow;}",
            "#banana:not(.\\9).exampleNamespace_variantWithMQ {--exampleNamespace0: 456px;}",
            "@media screen and example {#banana:not(.\\9) {--exampleNamespace0: 456px;}}",
          ],
          "text": "/* jsxstyle */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "exampleNumber": "var(--exampleNamespace0)",
        "exampleString": "var(--exampleNamespace1)",
        "setVariant": [Function],
        "styles": [
          "#banana { --exampleNamespace0: 123px;--exampleNamespace1: wow }",
          "#banana:not(.\\9).exampleNamespace_default { --exampleNamespace0: 123px;--exampleNamespace1: wow }",
          "#banana:not(.\\9).exampleNamespace_exampleVariant { --exampleNamespace1: variantWow }",
          "#banana:not(.\\9).exampleNamespace_variantWithMQ { --exampleNamespace0: 456px }",
          "@media screen and example { #banana:not(.\\9) { --exampleNamespace0: 456px } }",
        ],
        "variantNames": [
          "default",
          "exampleVariant",
          "variantWithMQ",
        ],
        "variants": {
          "default": {
            "activate": [Function],
            "className": "exampleNamespace_default",
          },
          "exampleVariant": {
            "activate": [Function],
            "className": "exampleNamespace_exampleVariant",
          },
          "variantWithMQ": {
            "activate": [Function],
            "className": "exampleNamespace_variantWithMQ",
            "mediaQuery": "@media screen and example",
          },
        },
      }
    `);
  });
});
