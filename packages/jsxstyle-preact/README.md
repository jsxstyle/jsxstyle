# jsxstyle

jsxstyle is intended to be the best way to style JSX components. It provides a best-in-class developer experience without sacrificing performance, and has little regard for [existing CSS orthodoxy](#why-use-jsxstyle-instead-of-bemsmacssoocssetc).

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
    <Block fontWeight={600}>Justin Bieber</Block>
    <Block fontStyle="italic">Canadian</Block>
  </Col>
</Row>
```

With jsxstyle, bouncing between JS and CSS in your editor is no longer necessary.
jsxstyle is built for teams. Problems stemming from multiple frontend contributors writing styles in a shared codebase are completely avoided, because styles are tied to _component instances_ instead of abstract reusable _CSS classes_. Onboarding new frontend contributors takes seconds, not hours, because jsxstyle’s mental model is easy to teach and easy to learn. Thanks to the declarative nature of inline styles, frontend contributors can see at a glance exactly how an element is styled.

Carry on to read a brief overview, or [skip to the FAQs](#faqs).

## Hello world 👋

Here’s an example of a stylable input with a few initial styles set:

```jsx
import { Block } from 'jsxstyle-preact';
import { h } from 'preact';

export default function FancyInput({type, placeholder, ...props}) {
  return (
    <Block
      fontSize={16}
      lineHeight="20px"
      fontWeight={400}
      color="#444"
      placeholderColor="#999"
      padding="4px 6px"
      marginBottom={10}
      borderRadius={3}
      borderWidth="1px"
      borderColor="#BBB"
      activeBorderColor="#999"
      borderStyle="solid"
      {...props}
      component="input"
      props={{ type, placeholder }}
    />
  );
}
```

When jsxstyle components are rendered, inline styles are converted to a single CSS rule with a hashed, content-based class name. The generated CSS rule is added to the document and a `div` (or specified `component`) is output with the hashed class name.

jsxstyle provides a set of components with default styles based on a few commonly used style properties:

| Component | Default styles |
|:---|:---|
| `Block` | `display: block;` |
| `Inline` | `display: inline;` |
| `InlineBlock` | `display: inline-block;` |
| `Row` | `display: flex; flex-direction: row;` |
| `Col` | `display: flex; flex-direction: column;` |
| `Grid` | `display: grid;` |
| `Box` | _No default styles_ |

All props passed to these components are assumed to be CSS properties.
There are six exceptions to this rule:

| Property | Type | Description |
|:---|:--|:---|
| `component`| `string`,&nbsp;`function`,&nbsp;or&nbsp;`object` | the underlying HTML tag or component to render. Defaults&nbsp;to&nbsp;`'div'` |
| `props`| `object` | additional props to pass directly to the underlying tag&nbsp;or&nbsp;component. |
| `mediaQueries` | `object` | an object of media query strings keyed by prefix. More&nbsp;on&nbsp;that&nbsp;[below](#media-queries). |
| `class` | `string` | Class name to be passed through to the underlying tag&nbsp;or&nbsp;component. |
| `style` | `any` | _Passed through untouched_ |
| `ref` | `any` | _Passed through untouched_ |


## Features

### Pseudoelements and pseudoclasses

To specify a pseudoelement or pseudoclass on a style property, prefix the prop with the name of the applicable pseudoelement or pseudoclass. If you’d like to specify a pseudoelement _and_ a pseudoclass for a style prop, start with the pseudoclass—i.e., `hoverPlaceholderColor`, not `placeholderHoverColor`.

```jsx
<Block
  component="input"
  color="#888"
  activeColor="#333"
  placeholderColor="#BBB"
/>
```

| Supported Pseudoclasses | Supported Pseudoelements |
|---|---|
| `active`, `checked`, `disabled`, `empty`, `enabled`, `focus`, `hover`, `invalid`, `required`, `target`, `valid` | `placeholder`, `selection`, `before`, `after` |

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

<br>

# FAQs

## Why write styles inline with jsxstyle?

<details>
<summary>Writing styles inline does away with name fatigue and constantly bouncing between CSS and component code in your editor, and jsxstyle’s approach to inline styles ensures that a best-in-class developer experience comes with no performance cost.</summary>

1. ### Naming things is hard.

    Naming components is hard enough, and there are only so many synonyms for “wrapper”. Since jsxstyle manages CSS and corresponding generated class names, what the actual class names _are_ becomes unimportant. jsxstyle can generate short, production-optimized class names and retain a mapping of those class names to corresponding style objects.

2. ### Jumping between JS and CSS in your editor wastes time.

    With inline styles, styles live _alongside_ the components they style. CSS has always been a language that describes what HTML elements look like. With jsxstyle, those descriptions are right where you need them.

3. ### Styles are… _inline_.

    When styles are written inline, any frontend contributor can look at an element and know in a matter of seconds _exactly_ how it’s styled. Inline styles describe an element’s appearance better than CSS classes ever could, and because you don’t have to worry about the class abstraction, there’s no fear of you or another frontend contributor taking a pure CSS class (like `.red { color: tomato }`) and corrupting it by modifying its styles.

    Also, because styles are inline, when you delete a component, you delete its style properties along with it. Dead CSS is no longer a concern.

4. ### Styles written inline don’t _remain_ inline.

    jsxstyle is first and foremost _syntax_ for styling components. The styles you specify on jsxstyle components are added to the document and a `div` or component you specify is output with a class name that points to the added styles.

5. ### Building tooling around inline styles is simple and straightforward.

    Statically analyzing inline styles on known components is trivial. Most of the styles you’ll end up writing on jsxstyle primitive components are static. Once you’re done perusing this README, check out [`jsxstyle-loader`][loader]. It’s a webpack loader that, at build time, extracts static styles defined on jsxstyle components into separate CSS files. `jsxstyle-loader` reduces and in some cases _entirely removes_ the need for runtime jsxstyle. jsxstyle becomes nothing more than syntactic sugar for styling components, much like how JSX itself is syntactic sugar for nested function calls. Dude, that’s next level!

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

1. In a server environment, the function that adds styles to the document is a noop, but it can be replaced with any arbitrary function. When server rendering, you can aggregate jsxstyle-injected styles when rendering your app to a string, and then add those styles to the response you send to the client.

2. jsxstyle builds a cache of styles that have been added to the document to ensure they’re added exactly once. When server rendering, this cache will need to be reset between each render.

Here’s a minimal (untested!) example of jsxstyle server rendering with Koa:

```jsx
import { cache } from 'jsxstyle-preact';
import Koa from 'koa';
import { h, renderToString } from 'preact';

import App from './App';

// aggregate styles as they’re added to the document
let styles = '';
cache.injectAddRule(css => {
  styles += css;
});

const app = new Koa();
app.use(async ctx => {
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

## What about global styles?

jsxstyle only manages styles written on jsxstyle components. Where you put global styles is entirely up to you. At Smyte, we use a separate shared style sheet that contains a few reset styles.

# Browser support

jsxstyle is tested [on every push][travis] in [a wide array of browsers, both old and new][sauce]. Shout out to **Sauce Labs** for making cross browser testing _free_ for open source projects. Sauce Labs is _shockingly easy_ to integrate with other services. I’m not gonna say it’s simple to get set up, because it’s not, but once it’s up and running, damn, it’s easy. They even make an SVG test matrix you can drop into your README:

[![Sauce Test Status](https://saucelabs.com/browser-matrix/jsxstyle.svg)](https://saucelabs.com/u/jsxstyle)

Another shout out to **Travis CI** for 1. making dope software and 2. making their open source plan free as well. The plan doesn’t have a cool, punny name like _Open Sauce_ but whatever. Gotta play with the hand you’re dealt I suppose.

# Contributing

Got an idea for jsxstyle? Did you encounter a bug? [Open an issue][new issue] and let’s talk it through. [PRs welcome too][pr]!

# Alternatives

So you don’t think jsxstyle is the thing for you? That’s quite alright. It’s a good time to be picky about exactly how and where your styles are written. We’re in the golden age of component-based web frameworks, and a lot of ancient “best practices” that were set in place by the old guard are being rethought, to everyones benefit. It’s a weird and exciting time to be making stuff for the web.

- [Tachyons][] by [Adam Morse][mrmrs] enables a lot of the the same benefits as jsxstyle but allows you to still write CSS classes. I love the “no new CSS” concept behind Tachyons. Tachyons elegantly solves the issues that Adam covers in [his excellent blog post on scalable CSS][scalable css].

- [Rebass][] by [jxnblk][] is “A functional React UI component library, built with `styled-components”`. Rebass has similar API to jsxstyle. Syntactically it’s more compact, and it has a few more tricks. We don’t like tricks over here at jsxstyle dot com but we do give Rebass two meaty thumbs up.

[`styled-components`][styled-components] and (more recently) [`emotion`][emotion] have both gained serious traction in the frontend JS community. I can’t do either system justice in a single sentence and I’ve never used either system, but they both seem like reasonable jsxstyle alternatives that embrace the funky things you can do with tagged template literals.

[pr]: https://github.com/smyte/jsxstyle/pulls
[new issue]: https://github.com/smyte/jsxstyle/issues/new
[new framework]: https://github.com/smyte/jsxstyle/issues/67

[react]: https://github.com/smyte/jsxstyle/packages/jsxstyle-preact
[preact]: https://github.com/smyte/jsxstyle/packages/jsxstyle-preact
[loader]: https://github.com/smyte/jsxstyle/packages/jsxstyle-loader

[rebass]: https://github.com/jxnblk/rebass
[jxnblk]: https://github.com/jxnblk
[mrmrs]: https://github.com/mrmrs
[scalable css]: http://mrmrs.github.io/writing/2016/03/24/scalable-css/
[tachyons]: http://tachyons.io

[styled-components]: https://www.styled-components.com
[emotion]: https://github.com/emotion-js/emotion

[travis]: https://travis-ci.org/smyte/jsxstyle
[sauce]: https://saucelabs.com/u/jsxstyle

