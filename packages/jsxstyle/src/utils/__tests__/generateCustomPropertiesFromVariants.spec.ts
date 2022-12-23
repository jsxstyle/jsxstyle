import { generateCustomPropertiesFromVariants } from '../generateCustomPropertiesFromVariants';

describe('generateCustomPropertiesFromVariants', () => {
  it('works', () => {
    expect(
      generateCustomPropertiesFromVariants(
        {
          default: {
            foreground: '#000',
            background: '#FFF',
            containerRadius: 2,
            width: 2 / 3,
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
          "containerRadius": "var(--example-namespace-containerRadius)",
          "foreground": "var(--example-namespace-foreground)",
          "width": "var(--example-namespace-width)",
        },
        "overrideClasses": {
          "darkMode": "example-namespace-override__darkMode",
          "default": "example-namespace-override__default",
        },
        "styles": [
          ":root { --example-namespace-foreground: #000;--example-namespace-background: #FFF;--example-namespace-containerRadius: 2px;--example-namespace-width: 66.6667%; }",
          "@media test media query { :root { --example-namespace-foreground: #FFF;--example-namespace-background: #000; } }",
          ":root.example-namespace-override__default, :root .example-namespace-override__default { --example-namespace-foreground: #000;--example-namespace-background: #FFF;--example-namespace-containerRadius: 2px;--example-namespace-width: 66.6667%; }",
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
