# jsxstyle [<img src="https://badgen.net/bundlephobia/minzip/jsxstyle">](https://npmjs.com/package/jsxstyle) [![Sauce Test Status](https://app.saucelabs.com/buildstatus/jsxstyle)](https://app.saucelabs.com/u/jsxstyle)

jsxstyle is an inline style system for React and Preact. It provides a best-in-class developer experience without sacrificing performance.

Styles are written _inline_ on a special set of components exported by jsxstyle. Inline styles on these components are converted to CSS rules and added to the document right as they’re needed.

With `jsxstyle`, your component code looks like this:

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
    backgroundImage="url(http://graph.facebook.com/justinbieber/picture?type=large)"
  />
  <Col fontFamily="sans-serif" fontSize={16} lineHeight="24px">
    <Block fontWeight={600}>Justin Bieber</Block>
    <Block fontStyle="italic">Canadian</Block>
  </Col>
</Row>
```

<!-- yeah we’ve got mf emoji -->

## ⚡️ Style as fast as you can think.

Jumping between JS and CSS in your editor is no longer necessary. Since style are inline, you can determine at a glance exactly how an element is styled. jsxstyle frees you up to do what you do best—write styles.

## ✅ Inline styles done right.

Just because styles are _written_ inline doesn’t mean they _stay_ inline. jsxstyle’s approach to inline styles ensures that a best-in-class developer experience comes with no performance cost.

## 😪 No more naming fatigue.

Naming components is hard enough, and there are only so many synonyms for “wrapper”. jsxstyle provides a set of stylable components, each with a few default styles set. These primitive stylable components form a set of _building blocks_ that you can reuse throughout your application. You can still create named stylable components if you wish, by utilizing a paradigm you’re already familiar with: composition. No funky syntax necessary:

```jsx
const RedBlock = (props) => <Block {...props} color="red" />;
```

## 🍱 Scoped styles right out the box.

Styles written on jsxstyle components are scoped to _component instances_ instead of abstract reusable class names. That’s not to say we’ve abandoned class names, though; styles on jsxstyle components are extracted into CSS rules and assigned a _hashed, content-based class name_ that is intentionally unlike a human-written name.

## 👯 Team friendly by design.

jsxstyle’s mental model is easy to teach and easy to learn, which means onboarding new frontend contributors takes _seconds_, not hours. Since styles applied by jsxstyle are scoped to component instances, frontend contributors don’t need a complete knowledge of the system in order to be 100% productive right from the start.

## 🛠 Powerful build-time optimizations.

Styles written inline on a set of components from a known source can very easily be statically analyzed, which opens up new possibilities for tooling and optimization. One such optimization is [`jsxstyle-webpack-plugin`][jsxstyle-webpack-plugin], a webpack plugin that extracts static styles from jsxstyle components _at build time_. `jsxstyle-webpack-plugin` reduces and in some cases _entirely removes_ the need for runtime jsxstyle.

# Getting started

Install the `jsxstyle` package with your preferred node package manager. Components for React can be imported from `jsxstyle`, and components for Preact can be imported from `jsxstyle/preact`.

jsxstyle provides the following seven components:

| Component     | Default styles                                  |
| :------------ | :---------------------------------------------- |
| `Block`       | `display: block;`                               |
| `Inline`      | `display: inline;`                              |
| `InlineBlock` | `display: inline-block;`                        |
| `Row`         | `display: flex; flex-direction: row;`           |
| `Col`         | `display: flex; flex-direction: column;`        |
| `InlineRow`   | `display: inline-flex; flex-direction: row;`    |
| `InlineCol`   | `display: inline-flex; flex-direction: column;` |
| `Grid`        | `display: grid;`                                |
| `Box`         | _No default styles_                             |

All props passed to these components are assumed to be CSS properties.
There are five exceptions to this rule:

<!-- prettier-ignore -->
| Property | Type | Description |
| :-- | :-- | :-- |
| `component`    | `string`,&nbsp;`function`,&nbsp;or&nbsp;`object` | the underlying HTML tag or component to render. Defaults&nbsp;to&nbsp;`'div'` |
| `props`        | `object` | additional props to pass directly to the underlying tag&nbsp;or&nbsp;component. |
| `mediaQueries` | `object` | an object of media query strings keyed by prefix. More&nbsp;on&nbsp;that&nbsp;[below](#media-queries). |
| `className`    | `string` | Class name to be passed through to the underlying tag&nbsp;or&nbsp;component. |
| `style`        | `any`    | _Passed through untouched_ |

## Features

### Pseudoelements and pseudoclasses

To specify a pseudoelement or pseudoclass on a style property, prefix the prop with the name of the applicable pseudoelement or pseudoclass. If you’d like to specify a pseudoelement _and_ a pseudoclass for a style prop, start with the pseudoclass—i.e., `hoverPlaceholderColor`, not `placeholderHoverColor`.

```jsx
import { Block } from 'jsxstyle/preact';

<Block
  component="input"
  color="#888"
  activeColor="#333"
  placeholderColor="#BBB"
/>;
```

<!-- prettier-ignore -->
| Supported Pseudoclasses | Supported Pseudoelements |
| -- | -- |
| `active`, `checked`, `disabled`, `empty`, `enabled`, `focus`, `hover`, `invalid`, `link`, `required`, `target`, `valid` | `placeholder`, `selection`, `before`, `after` |

<br>

### Media queries

Define a `mediaQueries` property with an object of media queries keyed by whatever prefixes you want to use. Prepend these media query keys to any style props that should be contained within media query blocks. Note that only one media query prefix can be applied at a time.

```jsx
<Block
  mediaQueries={{
    sm: 'screen and (max-width: 640px)',
    lg: 'screen and (min-width: 1280px)',
  }}
  color="red"
  smColor="blue"
  lgColor="green"
/>
```

#### `useMatchMedia` hook

> Experimental, available in `jsxstyle@next`

jsxstyle exports a hook, `useMatchMedia`, that enables the developer to subscribe to media query change events and react accordingly. Here’s the hook in action:

```jsx
import { Block, useMatchMedia } from 'jsxstyle';

export const RedOrBlueComponent = ({ children }) => {
  const isSmallScreen = useMatchMedia('screen and (max-width: 800px)');

  // text color is red when viewport <= 800px, blue when viewport > 800px
  return <Block color={isSmallScreen ? 'red' : 'blue'}>{children}</Block>;
};
```

When this hook is used in combination with `jsxstyle-webpack-plugin`, prop values will be extracted if the prop passed to the component is a ternary and if the alternate and consequent values of the ternary are both [static][].

<br>

### Convenient animation support

> Experimental, available in `jsxstyle@next`

You can define an animation inline using object syntax, where the key is the specific keyframe name and the value is an object of styles:

```tsx
<Block
  animation={{
    from: { opacity: 0 },
    to: { opacity: 1 },
  }}
  animationDuration="600ms"
  animationDirection="alternate"
/>
```

### Shorthand properties for same-axis `padding` and `margin`

You can set margin or padding on the same axis—either horizontal or vertical—by setting `marginH`/`marginV` or `paddingH`/`paddingV`.

Note: shortcut props should not be used with in combination with -Top/Left/Bottom/Right variants. Prop names on jsxstyle components are sorted alphabetically before the styles are stringified, which means that styles will be applied alphabetically.

<br>

# FAQs

## Why write styles inline with jsxstyle?

<details>
<summary>Writing styles inline does away with name fatigue and constantly bouncing between CSS and component code in your editor, and jsxstyle’s approach to inline styles ensures that a best-in-class developer experience comes with no performance cost.</summary>

1.  ### Naming things is hard.

    jsxstyle manages CSS and corresponding generated class names, which means that _what those class names actually are becomes unimportant_. jsxstyle can generate short, production-optimized class names and retain a mapping of those class names to corresponding style objects. All you have to do is worry about actual style properties.

2.  ### Jumping between JS and CSS in your editor wastes time.

    There’s no need to constantly jump between components and the CSS file(s) that define how those components are styled because styles are defined right at the component level. CSS has always been a language that describes what HTML elements look like. With jsxstyle, those descriptions are right where you need them.

3.  ### Styles are… _inline_.

    With inline styles, any frontend contributor can look at an element and know in a matter of seconds _exactly_ how it’s styled. Inline styles describe an element’s appearance better than CSS classes ever could, and because you don’t have to worry about the class abstraction, there’s no fear of you or another frontend contributor taking a pure CSS class (like `.red { color: tomato }`) and corrupting it by modifying its styles.

    Also, because styles are inline, when you delete a component, you delete its style properties along with it. Dead CSS is no longer a concern.

4.  ### Styles written inline don’t _remain_ inline.

    jsxstyle is first and foremost _syntax_ for styling components at a particular scope. The styles you specify on jsxstyle components are added to the document and a `div` or component you specify is output with a class name that points to the added styles.

5.  ### Building tooling around inline styles is simple and straightforward.

    Statically analyzing inline styles on known components is trivial. Most of the styles you’ll end up writing on jsxstyle primitive components are static. Once you’re done perusing this README, check out [`jsxstyle-webpack-plugin`][jsxstyle-webpack-plugin]. It’s a webpack plugin that, at build time, extracts static styles defined on jsxstyle components into separate CSS files. `jsxstyle-webpack-plugin` reduces and in some cases _entirely removes_ the need for runtime jsxstyle. jsxstyle becomes nothing more than syntactic sugar for styling components, much like how JSX itself is syntactic sugar for nested function calls. Dude, that’s next level!

</details>

## Why use jsxstyle instead of BEM/SMACSS/OOCSS/etc.?

<details>
<summary>jsxstyle provides all the benefits of a CSS class naming/organization system, but <em>without the system</em>.</summary><br>

[Writing CSS at scale is hard][scalable css]. Overly specific selectors cause specificity collisions. More generic selectors cause overstyling. Being a responsible frontend contributor in a shared codebase means you have to have a working knowledge of the system before you can contribute new code without introducing redundancies or errors.

Countless systems have been developed to either solve or circumvent inherent problems with writing CSS in a team environment. Most of these systems attempt to solve the complexity of writing CSS with _even more complex systems_. Once a system is implemented it has to be closely adhered to. CSS systems are fantastic in theory, but in practice, a CSS system is only as good as the most negligent frontend contributor on your team.

jsxstyle provides all the benefits of a good CSS class-naming system, with the added benefit of _not having to learn or remember a CSS class-naming system_.

- ### No more specificity issues, collisions, accidental overstyling, or inscrutable class names.

  jsxstyle manages class names and generated styles, leaving you to do what you do best… write styles. Selector complexity is a thing of the past. Each jsxstyle component gets a single class name based on the inline styles specified on the component. The class name is reused when repeat instances of that set of style props are encountered.

- ### No more bikeshedding!

  No more extended discussions about which CSS class naming strategy is best! I cannot emphasize enough how much time and mental energy this saves. Code review is simple as well. CSS-related nits only involve _actual style properties_. Conversations about how to style a thing begin and end with _the actual CSS properties that need to be written_.

- ### Onboarding new frontend contributors takes seconds, not hours.
  A knowledge of existing styles is _not required_ for a new frontend contributor to be 100% productive right from the start. In codebases without jsxstyle, in order for someone to be able to contribute, they usually have to know what styles to put where and where to look to put new styles. There are usually mixins and variables they don’t know exist because they don’t yet “know their way around the place”. With jsxstyle, you’re just writing styles on components.
  </details>

## Can I use jsxstyle with existing CSS?

Yes! jsxstyle is designed to work _alongside_ existing styles and style systems. In order to avoid class name collisions, class names generated by jsxstyle are hashed names that are _intentionally unlike_ class names that a human would write. As far as specificity is concerned, jsxstyle uses single class names as selectors, which makes overriding styles in your existing system easy (though not recommended).

## Does jsxstyle support server rendering?

<details>
<summary>Yep!</summary><br>

jsxstyle exports a `cache` object with a few functions that make adding support for server rendering a breeze. Two things you need to know:

1.  In a server environment, the function that adds styles to the document is a noop, but it can be replaced with any arbitrary function. When server rendering, you can aggregate jsxstyle-injected styles when rendering your app to a string, and then add those styles to the response you send to the client.

2.  jsxstyle builds a cache of styles that have been added to the document to ensure they’re added exactly once. When server rendering, this cache will need to be reset between each render.

Here’s a minimal (untested!) example of jsxstyle server rendering with Koa:

```jsx
import { cache } from 'jsxstyle';
import * as Koa from 'koa';
import * as React from 'react';
import { renderToString } from 'react-dom';

import App from './App';

// aggregate styles as they’re added to the document
let styles = '';
cache.injectOptions({
  onInsertRule(css) {
    styles += css;
  },
});

const app = new Koa();
app.use(async (ctx) => {
  // Reset cache and style string before each call to `renderToString`
  cache.reset();
  styles = '';
  const html = renderToString(<App path={ctx.request.path} />);

  ctx.body = `<!doctype html>
<style>${styles}</style>
<div id=".app-root">${html}</div>
<script src="/bundle.js"></script>
`;
});
```

</details>

## Does jsxstyle support autoprefixing?

Runtime jsxstyle does not bundle an autoprefixer, but autoprefixing is easily doable if you use webpack. We recommend combining [`jsxstyle-webpack-plugin`][jsxstyle-webpack-plugin] with a CSS loader that handles provides autoprefixing. At Smyte, we use `postcss-loader` with `postcss-cssnext`. Not using `webpack` and you’d like to see runtime autoprefixing supported? [Open an issue][new issue] and let us know!

## What about global styles?

jsxstyle only manages styles written on jsxstyle components. Where you put global styles is entirely up to you. At Smyte, we use a separate shared style sheet that contains a few reset styles.

# Browser support

jsxstyle is tested [on every push][github-actions] in [a wide array of browsers, both old and new][sauce]. Shout out to **Sauce Labs** for making cross browser testing _free_ for open source projects. Sauce Labs is _shockingly easy_ to integrate with other services. I’m not gonna say it’s simple to get set up, because it’s not, but once it’s up and running, damn, it’s easy. They even make an SVG test matrix you can drop into your README:

[![Sauce Test Status](https://app.saucelabs.com/browser-matrix/jsxstyle.svg)](https://saucelabs.com/u/jsxstyle)

# Contributing

Got an idea for jsxstyle? Did you encounter a bug? [Open an issue][new issue] and let’s talk it through. [PRs welcome too][pr]!

# Alternatives

So you don’t think jsxstyle is the thing for you? That’s quite alright. It’s a good time to be picky about exactly how and where your styles are written. We’re in the golden age of component-based web frameworks, and a lot of ancient “best practices” that were set in place by the old guard are being rethought, to everyone’s benefit. It’s a weird and exciting time to be making stuff for the web.

Sorting through the myriad CSS-in-JS solutions out there can get tiring, but there are a few projects out there that have stuck out to me:

- [Tachyons][tachyons] by [Adam Morse][mrmrs] enables a lot of the the same benefits as jsxstyle but allows you to still use CSS classes. I love the “no new CSS” concept behind Tachyons. Tachyons elegantly solves the issues that Adam covers in [his excellent blog post on scalable CSS][scalable css].

- [Rebass][rebass] by [Brent Jackson][jxnblk] is “a functional React UI component library, built with `styled-components`”. Rebass has similar API to jsxstyle, but is a bit more opinionated when it comes to separation of presentation and logic. Syntactically it’s more compact, and it has a few more tricks. We don’t like tricks over here at jsxstyle dot com but we do give Rebass two meaty thumbs up.

[`styled-components`][styled-components] and (more recently) [`emotion`][emotion] have both gained serious traction in the frontend JS community. I can’t do either system justice in a single sentence and I’ve never used either system, but they both seem like reasonable jsxstyle alternatives that embrace the funky things you can do with tagged template literals.

[emotion]: https://github.com/emotion-js/emotion
[jsxstyle-webpack-plugin]: https://github.com/jsxstyle/jsxstyle/tree/main/packages/jsxstyle-webpack-plugin
[jxnblk]: https://github.com/jxnblk
[mrmrs]: https://github.com/mrmrs
[new issue]: https://github.com/jsxstyle/jsxstyle/issues/new
[pr]: https://github.com/jsxstyle/jsxstyle/pulls
[rebass]: https://github.com/jxnblk/rebass
[sauce]: https://saucelabs.com/u/jsxstyle
[scalable css]: http://mrmrs.github.io/writing/2016/03/24/scalable-css/
[static]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-webpack-plugin/#what-are-static-style-props
[styled-components]: https://www.styled-components.com
[tachyons]: http://tachyons.io
[github-actions]: https://github.com/jsxstyle/jsxstyle/actions
