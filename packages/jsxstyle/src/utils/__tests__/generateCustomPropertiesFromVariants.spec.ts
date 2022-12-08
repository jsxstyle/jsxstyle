import { generateCustomPropertiesFromVariants } from '../generateCustomPropertiesFromVariants';

describe('generateCustomPropertiesFromVariants', () => {
  it('works', () => {
    expect(
      generateCustomPropertiesFromVariants(
        {
          default: {
            foreground: '#000',
            background: '#FFF',
          },
          darkMode: {
            mediaQuery: 'test media query',
            foreground: '#FFF',
            background: '#000',
          },
        },
        'example-namespace'
      )
    ).toMatchInlineSnapshot(`
      {
        "customProperties": {
          "background": "var(--example-namespace-background)",
          "foreground": "var(--example-namespace-foreground)",
        },
        "overrideClasses": {
          "darkMode": "example-namespace-override__darkMode",
          "default": "example-namespace-override__default",
        },
        "styles": [
          ":root { --example-namespace-foreground: #000;--example-namespace-background: #FFF; }",
          "@media test media query { :root { --example-namespace-foreground: #FFF;--example-namespace-background: #000; } }",
          ":root.example-namespace-override__default, :root .example-namespace-override__default { --example-namespace-foreground: #000;--example-namespace-background: #FFF; }",
          ":root.example-namespace-override__darkMode, :root .example-namespace-override__darkMode { --example-namespace-foreground: #FFF;--example-namespace-background: #000; }",
        ],
        "variantNames": [
          "default",
          "darkMode",
        ],
      }
    `);
  });
});
