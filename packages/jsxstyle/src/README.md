# How jsxstyle works

If you’re interested in digging around in the internals of `jsxstyle`, you’ve come to the right place.

`jsxstyle` is comprised of three conveniently alliterated parts:

1. the **core**, a function that converts `jsxstyle` inline prop syntax into valid CSS,
2. the **cache** that manages adding CSS to the document head, and
3. the **component factory** that outputs components that support `jsxstyle`’s inline style syntax.

## The core

The core function, [**getStyleKeysForProps**][1], takes an object of props and splits it into separate style objects by pseudoclass, pseudoelement, and media query. CSS property names are [alphabetised and converted to snake case][2], and property values are [converted to CSS-friendly values][3]. The return value is an object of separated style objects keyed with a specially-formatted key that, when sorted, will order each style object in the proper order. It also provides a `styleCacheKey` property that represents the original props object.

## The cache

[**styleCache**][4]’s `getClassName` method takes an object of props and passes it through to `getStyleKeysForProps`. The `styleCacheKey` it receives from `getStyleKeysForProps` is [hashed][5] and used as the base of a class name that represents the props object. If this generated class name is not present in `styleCache`’s internal cache, the styles provided by `getStyleKeysForProps` are [added to the document head][6].

## The component factory

[**makeStyleComponentClass**][7] is a factory function that returns `jsxstyle` components. The returned component calls `styleCache.getClassName` with the component’s props when the component is instantiated and when it receives new props. The element returned by the `render` method defaults to a `div`, but can be customised by setting the `component` prop on the `jsxstyle` primitive component. The `className` prop of the returned element is set to the return value of `styleCache.getClassName`. The `style` prop is passed through to the returned element. The `props` prop is passed to the returned component as its props.

[1]: https://github.com/smyte/jsxstyle/blob/master/src/getStyleKeysForProps.js
[2]: https://github.com/smyte/jsxstyle/blob/master/src/hyphenateStyleName.js
[3]: https://github.com/smyte/jsxstyle/blob/master/src/dangerousStyleValue.js
[4]: https://github.com/smyte/jsxstyle/blob/master/src/styleCache.js
[5]: https://github.com/smyte/jsxstyle/blob/master/src/stringHash.js
[6]: https://github.com/smyte/jsxstyle/blob/master/src/addStyleToHead.js
[7]: https://github.com/smyte/jsxstyle/blob/master/src/makeStyleComponentClass.js
