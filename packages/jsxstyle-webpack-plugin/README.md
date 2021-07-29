# jsxstyle-webpack-plugin

`jsxstyle-webpack-plugin` is a webpack plugin that extracts [**static style props**](#what-are-static-style-props) from jsxstyle components into a separate CSS file.

Don’t know what jsxstyle is? Check out the [jsxstyle README][] for more information.

## Getting Started

1.  Import `jsxstyle-webpack-plugin` and add it to the `plugins` section of your webpack config.

2.  Add a new rule object with `jsxstyle-webpack-plugin`’s companion loader to your webpack config, _below_ any other JS loaders.

    > `jsxstyle-webpack-plugin` relies on untranspiled JSX to be present in order to extract styles. Since webpack loaders run from right to left and bottom to top, `jsxstyle-webpack-plugin` should be placed at the end of your list of JS loaders.

3.  Ensure your webpack config contains a loader that handles `.css` files.

When you’re done, the relevant parts of your webpack config should look like this:

```js
const JsxstylePlugin = require('jsxstyle-webpack-plugin');

module.exports = {
  // ...
  plugins: [new JsxstylePlugin()],
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.js$/,
        use: [
          // loaders that transpile JSX should go before jsxstyle-webpack-plugin’s companion loader
          {
            loader: 'your-cool-js-loader',
          },

          // companion loader goes at the end
          JsxstylePlugin.loader,
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

Plugin options are passed in object format to `JsxstylePlugin`.

### `staticModules`

An array of _absolute_ paths to modules that should be treated as static. All modules in this list will be evaluated. Exports from these modules that are referenced in jsxstyle components will be inlined.

For example, with the following plugin config, any prop on a jsxstyle component that references a value from `./LayoutConstants.js` will be extracted:

```js
new JsxstylePlugin({
  staticModules: [require.resolve('./LayoutConstants')],
}),
```

## Loader options

### `styleGroups`

By default, `jsxstyle-webpack-plugin` will extract all static style props on a jsxstyle component into one class. This can lead to CSS classes that contain a lot of common style declarations. A good CSS minifier should help with this, but if you want a bit more control over how styles are grouped into CSS classes, you can provide an _array_ of CSS style objects. When `jsxstyle-webpack-plugin` encounters a component that contains all styles in a style object, those styles will be extracted into a separate class name.

For example, with the following loader config:

```js
{
  loader: JsxstylePlugin.loader,
  options: {
    styleGroups: [
      {
        display: 'block',
      },
      {
        marginLeft: 15,
        marginRight: 15,
      },
    ],
  },
}
```

...and a jsxstyle component that looks like this:

```jsx
import { Block } from 'jsxstyle';

<Block backgroundColor="blue" marginLeft={15} marginRight={15} padding={20} />;
```

...the styles on this component will be extracted into three separate classes:

```css
._x0 {
  display: block;
}
._x1 {
  margin-left: 15px;
  margin-right: 15px;
}
._x2 {
  background-color: blue;
  padding: 20px;
}
```

Without the `styleGroups` parameter, all five style props would be extracted into one class.

### `namedStyleGroups`

The `namedStyleGroups` config option is just like the `styleGroups` config option, with one key difference: it is expected to be an _object_ of CSS style objects, not an array. The key of the CSS style object will be used as the class name if all props and values are present on a jsxstyle component.

```js
{
  loader: JsxstylePlugin.loader,
  options: {
    namedStyleGroups: {
      db: {
        display: 'block',
      },
      mh15: {
        marginLeft: 15,
        marginRight: 15,
      },
    },
  },
}
```

### `parserPlugins`

`jsxstyle-webpack-plugin` uses `babylon` to parse javascript into an AST. By default, `jsxstyle-webpack-plugin` is preconfigured with most of `babylon`’s plugins enabled, but if you need to enable additional plugins, you can specify an array of plugins with the `parserPlugins` option.

You can see a list of all available plugins in [the `@babel/parser` documentation][parser plugins].

### `classNameFormat`

Out of the box, `jsxstyle-webpack-plugin` will use a _non-deterministic_ class naming scheme. Because webpack’s module iteration order is not guaranteed, class names will differ slightly between builds of the same code. If you need class names to remain the same each time the same code is bundled, set the `classNameFormat` option to `hash` in your loader config. Class names will be generated using a content-based hash.

## FAQs

### Can I use `jsxstyle-webpack-plugin` with Flow?

Yes! Flow parsing is automatically enabled for any non-Typescript files.

### Can I use `jsxstyle-webpack-plugin` with Typescript?

Yes! Take a look at [the TypeScript example][ts example] and [issue #82][issue 82] for some context. You’ll need to make a few configuration changes:

1.  Set `jsx` to `preserve` in the `compilerOptions` section of your `tsconfig.json` file.
2.  Ensure `jsxstyle-webpack-plugin`’s companion loader runs _after_ `ts-loader`. Webpack loaders run from bottom to top, to `jsxstyle-webpack-plugin` needs to be placed _before_ `ts-loader` in your webpack config.
3.  Add a loader that transpiles JSX, since `ts-loader` is now set to preserve JSX.

### It’s not working 😩

1.  Make sure the loader object `test` regex matches JS files that use jsxstyle.
2.  `jsxstyle-webpack-plugin` relies on JSX still being around, so make sure the companion loader runs _before_ `babel-loader` does its thing.
3.  `jsxstyle-webpack-plugin` only supports destructured `require`/`import` syntax:

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

Any modules marked as whitelisted with the [`whitelistedModules`](#whitelistedmodules) config option will also be added to the evaluation context.

If the value of a style prop is a ternary and both sides can be evaluated, the prop will be extracted and the ternary condition will be moved to the `className`.

If the value of a prop is a simple logical expression with the `&&` operator, it will be converted to a ternary with a null alternate.

### Inline styles… _are bad_.

See [the jsxstyle FAQs][jsxstyle faqs].

### Does it work with hot reloading?

It sure does, but using it in development will only cause confusion, since what you will see in the developer tools is the _transformed_ JS. `jsxstyle-webpack-plugin` is a _production_ optimisation.

### Any caveats?

CSS class names are reused across components but they are not de-duplicated. Any CSS minifier that combines identical class names will handle deduplication.

## Contributing

Got an idea for `jsxstyle-webpack-plugin`? Did you encounter a bug? [Open an issue][new issue] and let’s talk it through. [PRs welcome too][pr]!

[jsxstyle readme]: https://github.com/jsxstyle/jsxstyle/tree/main/packages/jsxstyle#readme
[jsxstyle faqs]: https://github.com/jsxstyle/jsxstyle/tree/main/packages/jsxstyle#faqs
[parser plugins]: https://new.babeljs.io/docs/en/next/babel-parser.html#plugins
[new issue]: https://github.com/jsxstyle/jsxstyle/issues/new
[pr]: https://github.com/jsxstyle/jsxstyle/pulls
[ts example]: https://github.com/jsxstyle/jsxstyle/tree/main/examples/jsxstyle-typescript-example
[issue 82]: https://github.com/jsxstyle/jsxstyle/issues/82#issuecomment-355141948
