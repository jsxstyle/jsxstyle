# jsxstyle-utils

If you’re interested in digging around in the internals of jsxstyle, you’ve come to the right place. `jsxstyle` only contains React- and preact-specific jsxstyle components. `jsxstyle-utils` exports the functions that provide specific features to both runtime jsxstyle and `jsxstyle-webpack-plugin`.

## Core functionality

### [`getStyleKeysForProps(props: object, pretty=false)`][getstylekeysforprops]

`getStyleKeysForProps` splits the provided object of `props` into separate style objects by pseudoclass, pseudoelement, and media query. CSS property names are [alphabetised and converted to snake case with `hyphenateStyleName`](#hyphenatestylenamename-string), and property values are [converted to CSS-friendly values with `dangerousStyleValue`](#dangerousstylevaluename-string-value-any). The return value is an object of separated style objects keyed with a specially-formatted key that, when sorted, will order each style object in the proper order. The returned object also provides a `styleCacheKey` property that represents the original props object. If the `pretty` param is set to `true`, non-essential whitespace (indentation and newlines) will be included in the output CSS.

### [`getStyleCache()`][getstylecache]

`getStyleCache` returns an object consisting of four methods for manipulate a cache of styles:

- `cache.getClassName(props: object)`: takes an object of props and passes it through to `getStyleKeysForProps`. The `styleCacheKey` it receives from `getStyleKeysForProps` is [hashed with `stringHash`](#stringhashcontent-string) and used as the base of a class name that represents the props object. If this generated class name is not present in the internal style cache, the class name is added to the cache and the corresponding styles provided by `getStyleKeysForProps` are [added to the document with `addStyleToHead`](#addstyletoheadrule-string). The generated class name is returned.

- `cache.reset()`: sets the internal style cache object to a new object.

- `cache.injectOptions(options: object)`: allows the user to inject config options into the style cache. Available options:
  - `onInsertRule(rule: string, props: object)`: function called each time a string of styles is added to the document. If provided, this function will be called once for each unique string of styles. Return `false` from `onInsertRule` to prevent the CSS rule from being added to the document head.
  - `getClassName(styleKey: string, props: object)`: function that should return a CSS class name unique to the `styleKey`.
  - `pretty: boolean`: whether or not CSS output should contain non-essential whitespace.

Each component returned by a jsxstyle component factory calls `cache.getClassName` with the component’s props whenever the component receives props. The `class`/`className` prop of the returned element is set to the return value of `getClassName`.

## Utilities

### [`addStyleToHead(rule: string)`][addstyletohead]

`addStyleToHead` creates a `style` element and adds the provided `rule` param to the document head using `sheet.insertRule`.

### [`dangerousStyleValue(name: string, value: any)`][dangerousstylevalue]

`dangerousStyleValue` converts the provided `value` according to what the `name` expects. Most notably, this function adds `px` suffixes to unitless properties (`padding`, `margin`, etc.). This is a slightly modified version of the `dangerousStyleValue` function that ships with React.

### [`hyphenateStyleName(name: string)`][hyphenatestylenames]

`hyphenateStyleName` converts camelCased names to snake-case. Vendor prefixes are properly formatted. This is a slightly modified version of the `hyphenateStyleName` function that ships with React.

### [`stringHash(content: string)`][stringhash]

`stringHash` is a copy of [Dark Sky’s `string-hash` module][string-hash] converted to ES module syntax.

## Constants

### [`componentStyles`][componentstyles]

An object of styles keyed by component name. This is the object representation of the components exported by jsxstyle.

| Key           | Value                                          |
| :------------ | :--------------------------------------------- |
| `Block`       | `{ display: 'block' }`                         |
| `Inline`      | `{ display: 'inline' }`                        |
| `InlineBlock` | `{ display: 'inline-block' }`                  |
| `Row`         | `{ display: 'flex', flexDirection: 'row' }`    |
| `Col`         | `{ display: 'flex', flexDirection: 'column' }` |
| `Grid`        | `{ display: 'grid' }`                          |
| `Box`         | `null`                                         |

[string-hash]: https://github.com/darkskyapp/string-hash
[addstyletohead]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-utils/src/addStyleToHead.js
[componentstyles]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-utils/src/componentStyles.js
[dangerousstylevalue]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-utils/src/dangerousStyleValue.js
[getstylecache]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-utils/src/getStyleCache.js
[getstylekeysforprops]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-utils/src/getStyleKeysForProps.js
[hyphenatestylenames]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-utils/src/hyphenateStyleName.js
[stringhash]: https://github.com/jsxstyle/jsxstyle/blob/main/packages/jsxstyle-utils/src/stringHash.js
