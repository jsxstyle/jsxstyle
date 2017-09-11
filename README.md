# jsxstyle

`jsxstyle` is intended to be the best way to style React components. It has the
goals of having a best-in-class developer experience without sacrificing
performance, and has little regard for existing CSS orthodoxy :)

## Philosophy

Many of the DOM nodes in your app exist solely for style purposes. Styling
them can be cumbersome because of *name fatigue* (coming up with unique class
names for nodes that don't need a name, like `.outerWrapperWrapper`), selector
complexity, and constantly bouncing between your JS code and your CSS code in
your editor.

`jsxstyle` believes that, for the nodes that exist for pure styling purposes,
you should write styles inline with a friendly syntax, and furthermore, that just
because you're writing your styles inline, doesn't mean that they actually get rendered
into the browser that way (that is, there should be no performance penalty).

## Hello world

`npm install jsxstyle` and then write code like this:

```jsx
var Block = require('jsxstyle/Block');
var React = require('react');

var MyComponent = React.createClass({
  render: function() {
    return <Block color="red">Hello, world!</Block>;
  }
});
```

`jsxstyle` provides a few components that correspond to the most commonly used
values of the CSS `display` property:

  * Block
  * Flex
  * Inline
  * InlineBlock
  * InlineFlex
  * Table
  * TableCell
  * TableRow

`jsxstyle` also includes a few flexbox helper components that set
the `flex-direction` property:

  * Row
  * Col

All props passed to these components are assumed to be CSS properties.
There are four exceptions to this rule:

  * `className`: additional CSS classes you would like to apply.
  * `component`: the underlying HTML tag or React component to render.
  * `props`: additional props to pass directly to the underlying HTML tag or React component.
  * `style`: styles to apply directly to the DOM node as actual inline styles. CSS properties that change frequently (when animating, for example) should be passed as a `style` object to avoid generating a massive number of classNames.

## Pseudoclasses

`jsxstyle` supports the `:hover`, `:focus`, and `:active` pseudoclasses.
You can prefix style props with the relevant pseudoclass to apply it:

```jsx
var MyComponent = React.createClass({
  render: function() {
    return (
      <Block
        color="red"
        hoverColor="yellow">
        Hello, world!
      </Block>
    );
  }
});
```

## Optimizations

### Style garbage collection

For big applications you'll want to call `jsxstyle.install()` to run the style garbage
collector. This will periodically prune dead stylesheets from the browser to improve
performance, especially in single-page apps.

## Experimental Optimizations

At build time, you can enable an optional **webpack loader** and **webpack plugin**
that will extract out static expressions (i.e. `margin={5}`) and expressions that only
reference globally-known constants and precompile them into static style sheets. This
has the advantage of reducing the number of props that React has to diff, and also, if
you use `JsxstylePlugin` with webpack, will let you deliver a separate static `.css`
file that can be cached and downloaded in parallel with the JS for maximum performance.

The webpack plugin and loader are experimental and remain undocumented. For more
information see the `experimental/` directory.

## Under the hood

At runtime, `jsxstyle` inserts stylesheets into the DOM that take the form of a single
unique class name per node. If two or more nodes share the same styles, the stylesheet
will be reused between the two nodes. Periodically, `jsxstyle` will reap stylesheets
that were inserted into the DOM if they are no longer used.

## FAQ

### Inline styles are bad.

`jsxstyle` is predicated on the idea that stylesheet rules are not a great way to reuse
styles and that components are the correct abstraction. `jsxstyle` does not have many
of the downsides of inline styles because the components are designed to be
presentational only and do not render large strings of inline styles under the hood.

### Is this used in production?

Yes, [Smyte](https://www.smyte.com/) has used jsxstyle exclusively in production for
almost two years.

[![Sauce Test Status](https://saucelabs.com/browser-matrix/jsxstyle.svg)](https://saucelabs.com/u/jsxstyle)
