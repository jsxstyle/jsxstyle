# jsxstyle/webpack-plugin

`jsxstyle/webpack-plugin` is a webpack plugin that extracts [**static style props**](#what-are-static-style-props) from jsxstyle components into a separate CSS file.

Don’t know what jsxstyle is? Check out the [jsxstyle README][] for more information.

## Getting Started

1.  Import `jsxstyle/webpack-plugin` and add it to the `plugins` section of your webpack config.

2.  Add a new rule object with `jsxstyle/webpack-plugin`’s companion loader to your webpack config, _below_ any other JS loaders.

    > `jsxstyle/webpack-plugin` relies on untranspiled JSX to be present in order to extract styles. Since webpack loaders run from right to left and bottom to top, `jsxstyle/webpack-plugin` should be placed at the end of your list of JS loaders.

3.  Ensure your webpack config contains a loader that handles `.css` files.

When you’re done, the relevant parts of your webpack config should look like this:

```js
const { JsxstyleWebpackPlugin } = require('jsxstyle/webpack-plugin');

module.exports = {
  // ...
  plugins: [new JsxstyleWebpackPlugin()],
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.js$/,
        use: [
          // loaders that transpile JSX should go before jsxstyle/webpack-plugin’s companion loader
          {
            loader: 'your-cool-js-loader',
          },

          // companion loader goes at the end
          JsxstyleWebpackPlugin.loader,
        ],
      },
      {
        test: /\.css$/,
        use: 'your-cool-css-loader',
      },
      // ...
    ],
  },
};
```

## Plugin options

Plugin options are passed in object format to `JsxstyleWebpackPlugin`.

### `staticModules`

An array of _absolute_ paths to modules that should be treated as static. All modules in this list will be evaluated. Exports from these modules that are referenced in jsxstyle components will be inlined.

For example, with the following plugin config, any prop on a jsxstyle component that references a value from `./LayoutConstants.js` will be extracted:

```js
new JsxstyleWebpackPlugin({
  staticModules: [require.resolve('./LayoutConstants')],
}),
```

## Loader options

### `parserPlugins`

`jsxstyle/webpack-plugin` uses `@babel/parser` to parse javascript into an AST. By default, the webpack plugin is preconfigured with most of `@babel/parser`’s plugins enabled, but if you need to enable additional plugins, you can specify an array of plugins with the `parserPlugins` option.

You can see a list of all available plugins in [the `@babel/parser` documentation][parser plugins].

### `classNameFormat`

Out of the box, the jsxstyle webpack plugin will use a _non-deterministic_ class naming scheme. Because webpack’s module iteration order is not guaranteed, class names will differ slightly between builds of the same code. If you need class names to remain the same each time the same code is bundled, set the `classNameFormat` option to `hash` in your loader config. Class names will be generated using a content-based hash.

## FAQs

### Can I use the jsxstyle webpack plugin with Flow?

Yes! Flow parsing is automatically enabled for any non-Typescript files.

### Can I use the jsxstyle webpack plugin with Typescript?

Yes! Take a look at [the TypeScript example][ts example] and [issue #82][issue 82] for some context. You’ll need to make a few configuration changes:

1.  Set `jsx` to `preserve` in the `compilerOptions` section of your `tsconfig.json` file.
2.  Ensure `jsxstyle/webpack-plugin`’s companion loader runs _after_ `ts-loader`. Webpack loaders run from bottom to top, so `jsxstyle/webpack-plugin` needs to be placed _before_ `ts-loader` in your webpack config.
3.  Add a loader that transpiles JSX, since `ts-loader` is now set to preserve JSX.

### It’s not working 😩

1.  Make sure the loader object `test` regex matches JS files that use jsxstyle.
2.  `jsxstyle/webpack-plugin` relies on JSX still being around, so make sure the companion loader runs _before_ `babel-loader` does its thing.
3.  `jsxstyle/webpack-plugin` only supports destructured `require`/`import` syntax:

    ```jsx
    // Cool!
    import { Block } from 'jsxstyle';
    <Block />;

    // Neat!
    const { Block } = require('jsxstyle');
    <Block />;

    // Nope :(
    const Block = require('jsxstyle').Block;
    <Block />;
    ```

### What are “static style props”?

Simply put, static style props are props whose values can be evaluated at build time. By default, this consists of any literal type (`string`, `number`, `null`) as well as any variables provided to the evaluation context. The evaluation context is derived from the prop’s current scope.

For example, the `fontSize` prop in the following component will be marked as evaluatable and will be extracted as `42`:

```jsx
import { Block } from 'jsxstyle';

const bestNumber = 42;
<Block fontSize={bestNumber}>hello</Block>;
```

Any modules marked as static with the [`staticModules`](#staticModules) plugin config option will also be added to the evaluation context.

If the value of a style prop is a ternary and both sides can be evaluated, the prop will be extracted and the ternary condition will be moved to the `className`.

If the value of a prop is a simple logical expression with the `&&` operator, it will be converted to a ternary with a null alternate.

### Inline styles… _are bad_.

See [the jsxstyle FAQs][jsxstyle faqs].

### Does it work with hot reloading?

It sure does, but using it in development will only cause confusion, since what you will see in the developer tools is the _transformed_ JS. `jsxstyle/webpack-plugin` is a _production_ optimisation.

### Any caveats?

CSS class names are reused across components but they are not de-duplicated. Any CSS minifier that combines identical class names will handle deduplication.

## Contributing

Got an idea for the jsxstyle webpack plugin? Did you encounter a bug? [Open an issue][new issue] and let’s talk it through. [PRs welcome too][pr]!

[jsxstyle readme]: https://github.com/jsxstyle/jsxstyle/tree/main/packages/jsxstyle#readme
[jsxstyle faqs]: https://github.com/jsxstyle/jsxstyle/tree/main/packages/jsxstyle#faqs
[parser plugins]: https://new.babeljs.io/docs/en/next/babel-parser.html#plugins
[new issue]: https://github.com/jsxstyle/jsxstyle/issues/new
[pr]: https://github.com/jsxstyle/jsxstyle/pulls
[ts example]: https://github.com/jsxstyle/jsxstyle/tree/main/examples/jsxstyle-typescript-example
[issue 82]: https://github.com/jsxstyle/jsxstyle/issues/82#issuecomment-355141948
