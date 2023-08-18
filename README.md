# jsxstyle [<img src="https://badgen.net/bundlephobia/minzip/jsxstyle">](https://npmjs.com/package/jsxstyle) [![Sauce Test Status](https://app.saucelabs.com/buildstatus/jsxstyle)](https://app.saucelabs.com/u/jsxstyle)

### Inline styles for JSX—React, Preact, Solid… any JSX-centric JavaScript syntax, really.

jsxstyle is a styling toolkit built on three fundamental principles:

1. Styles should be colocated with the elements they’re styling.
2. A great developer experience should _never_ come at the cost of a great user experience.
3. New contributors to a codebase should be able to contribute without having to understand the entire codebase.

jsxstyle consists of a set of layout primitives—`Block`, `Row`, `Col`, and more—and a function called `css` that’s a thin wrapper around the core that powers these components.

## CSS feature support

- ✅ Media/container queries
- ✅ Pseudoclasses/pseudoelements
- ✅ Descendant selectors
- ✅ Custom properties

- **Team-friendly**: styles you write with jsxstyle only ever affect the elements that you’re styling.
- **Fantastic developer experience**: if you know CSS, you know how to use jsxstyle. If you don’t know CSS, jsxstyle is strongly typed, which means TypeScript and your code editor can lend a hand.
- Utilities for generating **CSS custom properties** and **subscribing to media query events**.
- Generated CSS is **atomic** by default.

### Bundler plugins for advanced build-time optimizations

jsxstyle ships with plugins for Vite, Webpack, and Next.js, all powered by a style extraction engine that that analyzes your code for static styles and extracts them out at build time. This can reduce or, in many cases, _entirely remove_ the need for runtime jsxstyle

### Managed specificity

The CSS that jsxstyle generates will always apply the same styles regardless of the order of the CSS rules.

## What’s in the box

jsxstyle exports a number of building block components that set some default styles:

| Component | Styles                                   |
| :-------- | :--------------------------------------- |
| `Block`   | `display: block;`                        |
| `Col`     | `display: flex; flex-direction: column;` |
| `Row`     | `display: flex; flex-direction: row;`    |
| `Grid`    | `display: grid;`                         |

Additional styles can be passed to these components as props:

```jsx
<Block color="red" fontWeight="bold">
  This text is red and bold
</Block>
```

Each building block component renders a `div` by default, but the component can be customized with the `component` prop:

```jsx
<Row component="label" cursor="pointer">
  <input type="checkbox" />
  <p>Confirm</p>
</Row>
```

Any component that accepts a `class` (Preact, Solid) or `className` (React) prop can be passed as the `component` prop too:

```jsx
const InputComponent = ({ className, value }) => (
  <input className={className} type="text" value={value} />
);

<Block component={InputComponent} border="1px solid #AAA" />;
```

Since props passed to a jsxstyle component are assumed to be style props, component props are passed a different way—the `props` prop. It’s sort of like how the `style` prop can be used to pass styles on non-jsxstyle components, except style props and component props have changed places.

```jsx
<Block
  component={InputComponent}
  props={{
    value: inputValue,
    onChange: handleInputChange,
  }}
  border="1px solid #AAA"
/>
```

Common component props and all `on`-prefixed props are filtered out of the style props and can be passed at the top level:

```jsx
<Block
  component={InputComponent}
  value={inputValue}
  onChange={handleInputChange}
  border="1px solid #AAA"
/>
```

For props that are more syntactically complex than a simple key and value, you can use the `css` prop. For example, here’s how you specify media queries and container queries:

```jsx
<Block
  padding={20}
  css={{
    '@media screen and (some-condition: some-value)': {
      padding: 10,
    },
    '@container (min-width: 1000px)': {
      padding: 30,
    },
  }}
/>
```

And here’s an example of descendant selectors:

```jsx
<Block
  css={{
    '& > *': {
      border: '1px solid red',
    },
    '&:hover > *': {
      border: '1px solid blue',
    },
  }}
/>
```

The ampersand (`&`) indicates to jsxstyle where the generated selector should go. Any string is valid as a key, as long as it contains one or more ampersands.

## Utility functions

### `useMatchMedia`

In environments where hooks are supported, you can import the `useMatchMedia` hook to subscribe to media query events:

```jsx
import { useMatchMedia } from 'jsxstyle/preact';

const ExampleComponent: preact.FunctionComponent = () => {
  const isSmallScreen = useMatchMedia('screen and max-width: 1000px');
  return <div>{isSmallScreen ? 'Small' : 'Big'} screen!</div>;
};
```

`useMatchMedia` has a unique interaction with jsxstyle components when paired with a jsxstyle bundler plugin. The `useMatchMedia` variable will be marked as static, and any static styles that use the variable as a condition will be extracted out as media queries.

Input:

```jsx
import { Block, useMatchMedia } from 'jsxstyle/preact';

const ExampleComponent = () => {
  const isSmallScreen = useMatchMedia('screen and (max-width: 1000px)');
  return <Block fontSize={isSmallScreen ? 18 : 36}>Hello</Block>;
};
```

Approximate built output:

```jsx
const ExampleComponent = () => {
  return <div className="x0 x1 x2">Hello</div>;
};
```

<!-- prettier-ignore -->
```css
.x0 { display: block }
@media screen and (max-width: 1000px) { .x1.x1 { font-size: 18px } }
.x2 { font-size: 36px }
```

_(More on the double `.x1` selector below)_

# Assorted commentary

## Managed specificity

There’s nothing worse than a CSS issue that only happens in production. CSS rule order matters and since bundlers can bundle CSS in non-deterministic ways, it’s surprisingly easy to accidentally clobber styles if you’ve got more than one CSS file in your project.

jsxstyle employs a simple system to keep CSS rule order from affecting styles:

- jsxstyle selectors only ever use class names. Selector specificity is increased by repeating the class name selector. (`.x1` is less specific than `.x1.x1`).
- All CSS rules have a base specificity of 1.
- Props with shorthand equivalents (for example: `font-size`) have a specificity of 2.
- Styles contained in media queries are granted +3 specificity.

What this looks like:

<!-- prettier-ignore -->
```css
.x0 { padding: 20px }
.x1.x1 { padding-left: 30px }
@media screen { .x2.x2.x2 { padding: 20px } }
@media screen { .x3.x3.x3.x3 { padding-left: 30px } }
```

## Why write styles inline?

Keeping styles separated from styled code has a few inherent pitfalls:

1. **Dead CSS**: If you delete styled code, you have to remember to delete corresponding styles that are no longer needed. This cruft is a form of tech debt and it affects both developers (more code to sift through) and your end users (more bytes sent).
2. **CSS house of cards**: If you modify shared CSS rules, it’s possible that your modification will affect unrelated code that’s styled using the same CSS rules.
3. **Specificity wars**: let’s say two selectors set the same style. If the specificity of both selectors is the same, whichever CSS selector appears last in your CSS is the one that wins. If the specificity is different, CSS rules get clobbered.

Potential solutions to these problems usually involve one or more solutions:

1. A well thought out **naming scheme** for CSS classes. Historically this includes things like BEM, SMACSS, and OOCSS.

   **Problem**: In addition to learning CSS, **you must now learn a naming scheme on top of CSS**. Naming things is hard. Each named rule you create requires some brainpower. New contributors can’t contribute at 100% until they fully understand the naming scheme. People will mess it up and it’ll become a topic of conversation in code review. It’s mental overhead that can be completely avoided.

2. **Atomic CSS**—one classname per style. One concept with many different implementations.

   **Problem**: In addition to learning CSS, **you must now learn a meta-syntax on top of CSS**. In the case of ACSS, there are short versions of every CSS property; for example, `background-color: #fff` becomes `Bgc(#fff)`.

Here at jsx dot style, we like the end result of atomic CSS, but we aren’t wild about how you get there. With jsxstyle, you just write plain old CSS and jsxstyle will create your atomic CSS classes under the hood. All you have to know is how to convert kebab-case property names to camelCase.
