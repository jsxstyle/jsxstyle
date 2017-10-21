# jsxstyle

jsxstyle is the best way to style React (and Preact) components. It provides a best-in-class developer experience without sacrificing performance, and has little regard for [existing CSS orthodoxy][rip bem].

## The gist

With jsxstyle, there is no more ceremony surrounding styles. Instead of awkward tagged template literals or magical style functions, CSS declarations are passed as camel-cased JSX props to a set of primitive components exported by jsxstyle. When a component mounts, jsxstyle converts these props to optimized CSS classes and adds them to the document's `<head>`.

With jsxstyle, your component code looks like this:

```jsx
<Row alignItems="center" padding={15}>
  <Block
    backgroundColor="#EEE"
    boxShadow="inset 0 0 0 1px rgba(0,0,0,0.15)"
    borderRadius={5}
    height={64}
    width={64}
    marginRight={15}
    backgroundSize="contain"
    backgroundImage="url('http://graph.facebook.com/justinbieber/picture?type=large')"
  />
  <Col fontFamily="sans-serif" fontSize={16} lineHeight="24px">
    <Block fontWeight={600}>Justin Bieber</Block>
    <Block fontStyle="italic">Canadian</Block>
  </Col>
</Row>
```

With jsxstyle, bouncing between JS and CSS in your editor is no longer necessary. Thanks to the declarative nature of inline styles, frontend contributors can see at a glance exactly how an element is styled. By writing styles with _component instances_ instead of abstract "reusable" _CSS classes_ or prematurely abstracted style-only components, problems stemming from multiple contributors writing styles in a shared codebase are completely avoided.

## 📦 Packages

### [`jsxstyle`][jsxstyle]

`jsxstyle` provides a set of stylable components to be used with React.

At runtime, these stylable components convert inline styles to a single CSS rule with a hashed, content-based class name. The generated CSS rule is added to the document and a `div` (or specified `component`) with the hashed class name is output.

jsxstyle was built to take full advantage of paradigms familiar to anyone who’s written JSX. Here’s an example of a stylable input with a few initial styles set:

```jsx
import { Block } from 'jsxstyle';
import React from 'react';

export default function FancyInput({type, placeholder, value, onChange, ...props}) {
  return (
    <Block
      fontSize={16}
      lineHeight="20px"
      fontWeight={400}
      color="#444"
      placeholderColor="#999"
      backgroundColor="#FFF"
      padding="4px 6px"
      marginBottom={10}
      borderRadius={3}
      borderWidth="1px"
      borderColor="#BBB"
      activeBorderColor="#999"
      borderStyle="solid"
      {...props}
      component="input"
      props={{ type, placeholder, value, onChange }}
    />
  );
}
```

To read more about the reasoning behind jsxstyle, take a look at the [`jsxstyle` README][jsxstyle readme].

### [`jsxstyle-preact`][jsxstyle-preact]

`jsxstyle-preact` exports Preact versions of the components exported by `jsxstyle`.

### [`jsxstyle-loader`][jsxstyle-loader]

`jsxstyle-loader` is a `webpack` loader that extracts static styles from jsxstyle components at build time, reducing or in some cases _entirely removing_ the need for runtime jsxstyle. `jsxstyle-loader` is a production optimization.

To read more about `jsxstyle-loader`, check out the [`jsxstyle-loader` README][jsxstyle-loader readme].

### [`jsxstyle-utils`][jsxstyle-utils]

`jsxstyle-utils` exports a set of functions used by `jsxstyle-loader` and runtime versions of jsxstyle. You probably won’t need to use this package separately unless you’re adding support for a new framework.

[pr]: https://github.com/smyte/jsxstyle/pulls
[new issue]: https://github.com/smyte/jsxstyle/issues/new
[new framework]: https://github.com/smyte/jsxstyle/issues/67

[jsxstyle]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle
[jsxstyle-preact]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle-preact
[jsxstyle readme]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle#README
[rip bem]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle#why-use-jsxstyle-instead-of-bemsmacssoocssetc
[jsxstyle-loader]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle-loader
[jsxstyle-loader readme]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle#README
[jsxstyle-utils]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle-utils

[styled-components]: https://www.styled-components.com
[emotion]: https://github.com/emotion-js/emotion
[rebass]: https://github.com/jxnblk/rebass
[jxnblk]: https://github.com/jxnblk
[mrmrs]: https://github.com/mrmrs
[tachyons]: http://tachyons.io

[travis]: https://travis-ci.org/smyte/jsxstyle
[sauce]: https://saucelabs.com/u/jsxstyle

[bam]: https://www.youtube.com/watch?v=o4BOZcDMw_A
