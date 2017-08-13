# jsxstyle-loader

`jsxstyle-loader` is a webpack loader that extracts [**static style props**](#what-are-static-style-props) from `jsxstyle` components into a separate CSS file.

## Getting Started

Add a new rule object for `jsxstyle-loader` to your webpack config. `jsxstyle-loader` will add a CSS `require` to each component that uses `jsxstyle`, so make sure you have a loader that handles `.css` files as well.

```js
module.exports = {
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.js$/,
        use: 'jsxstyle-loader',
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

## Loader Options

### `styleGroups`
By default, `jsxstyle-loader` will extract all static style props on a `jsxstyle` component into one class. This can lead to CSS classes that contain a lot of common style declarations. A good CSS minifier should help with this, but if you want a bit more control over how styles are grouped into CSS classes, you can provide an _array_ of CSS style objects. When `jsxstyle-loader` encounters a component that contains all styles in a style object, those styles will be extracted into a separate class name.

For example, with the following loader config:

```js
// ...
{
  loader: 'jsxstyle-loader',
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
// ...
```

...and a `jsxstyle` component that looks like this:

```js
import { Block } from 'jsxstyle';

<Block
  backgroundColor="blue"
  marginLeft={15}
  marginRight={15}
  padding={20}
/>;
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

Without the `styleGroups` parameter, all five extracted style props would be in one class.

### `namedStyleGroups`

The `namedStyleGroups` config option is just like the `styleGroups` config option, with one key difference: it is expected to be an _object_ of CSS style objects, not an array. The key of the CSS style object will be used as the class name if all props and values are present on a `jsxstyle` component.

### `whitelistedModules`

The `whitelistedModules` config option allows you to add modules to the evaluation context. For example, with the following loader config, any prop on a `jsxstyle` component that references a value from `./LayoutConstants.js` will be assumed to be evaluatable:

```js
// ...
{
  loader: 'jsxstyle-loader',
  options: {
    whitelistedModules: [
      require.resolve('./LayoutConstants'),
    ],
  },
}
// ...
```

## FAQs probably

### It’s not working 😩

1. Make sure the loader object `test` regex matches JS files that use `jsxstyle`.
2. `jsxstyle-loader` relies on JSX still being around, so make sure it runs *before* `babel-loader` does its thing.
3. `jsxstyle-loader` only supports destructured `require`/`import` syntax:
    ```jsx
    // Cool!
    import { Block } from 'jsxstyle';
    <Block />;

    // Neat!
    const { Block } = require('jsxstyle');
    <Block />;

    // Nope :(
    const jsxstyle = require('jsxstyle');
    <jsxstyle.Block>;
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

See [the `jsxstyle` README](https://github.com/smyte/jsxstyle#faq).

### Does it work with hot reloading?

It sure does, but using it in development will only cause confusion, since what you will see in the developer tools is the _transformed_ JS. `jsxstyle-loader` is a _production_ optimisation.

### Any caveats?

One big one for now: CSS class names are not de-duplicated. It’s a feature I’d like to add before 1.0, but for now, I recommend using `postcss-loader` with the [`postcss-discard-duplicates`][discard dupes] plugin.


[jsxstyle]: https://github.com/smyte/jsxstyle#readme
[discard dupes]: https://github.com/ben-eb/postcss-discard-duplicates
