# jsxstyle & friends

This is the monorepo for jsxstyle and tools built for use with jsxstyle.

jsxstyle is intended to be the best way to style JSX components. It provides a best-in-class developer experience without sacrificing performance, and has little regard for [existing CSS orthodoxy][rip bem].

Styles are written _inline_ on a special set of components exported by jsxstyle. When the component is rendered, these inline styles are converted to CSS rules and added to the document.

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
    <Block fontWeight={500}>Justin Bieber</Block>
    <Block fontStyle="italic">Canadian</Block>
  </Col>
</Row>
```

With jsxstyle, jumping between JS and CSS in your editor is no longer necessary. Problems that have historically been difficult to solve, like specificity clashes and dead CSS, are _completely sidestepped_. Thanks to the declarative nature of inline styles, frontend contributors can see at a glance exactly how an element is styled. Onboarding new frontend contributors takes seconds, not hours, because jsxstyle’s mental model is easy to teach and easy to learn. Problems stemming from multiple frontend contributors writing styles in a shared codebase are completely avoided, because styles are tied to _component instances_ instead of abstract reusable _CSS classes_.

## 📦 Packages

### [`jsxstyle`][jsxstyle]

This package provides a set of stylable components to be used with React.

At runtime, these stylable components convert inline styles to a single CSS rule with a hashed, content-based class name. The generated CSS rule is added to the document and a `div` (or specified `component`) with the hashed class name is output.

jsxstyle was built to take full advantage of paradigms familiar to anyone who’s written JSX. Here’s an example of a stylable input with a few initial styles set::

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

To read more about the reasoning behind jsxstyle, check out the [`jsxstyle` README][jsxstyle readme].

### [`jsxstyle-preact`][jsxstyle-preact]

The same set of components exported by `jsxstyle`, but with a few Preact-specific changes.

### [`jsxstyle-loader`][jsxstyle-loader]

`jsxstyle-loader` is a `webpack` loader that extracts static styles from jsxstyle components at build time, reducing or in some cases _entirely removing_ the need for runtime jsxstyle. `jsxstyle-loader` is a production optimization.

To read more about `jsxstyle-loader`, check out the [`jsxstyle-loader` README][jsxstyle-loader readme].

[pr]: https://github.com/smyte/jsxstyle/pulls
[new issue]: https://github.com/smyte/jsxstyle/issues/new
[new framework]: https://github.com/smyte/jsxstyle/issues/67

[jsxstyle]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle
[jsxstyle-preact]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle-preact
[jsxstyle readme]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle#README
[rip bem]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle#why-use-jsxstyle-instead-of-bemoocsssmacssetc
[jsxstyle-loader]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle-loader
[jsxstyle-loader readme]: https://github.com/smyte/jsxstyle/tree/master/packages/jsxstyle#README

[styled-components]: https://www.styled-components.com
[emotion]: https://github.com/emotion-js/emotion
[rebass]: https://github.com/jxnblk/rebass
[jxnblk]: https://github.com/jxnblk
[mrmrs]: https://github.com/mrmrs
[tachyons]: http://tachyons.io

[travis]: https://travis-ci.org/smyte/jsxstyle
[sauce]: https://saucelabs.com/u/jsxstyle

[bam]: https://www.youtube.com/watch?v=o4BOZcDMw_A
