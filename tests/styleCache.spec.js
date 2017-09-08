'use strict';

const styleCache = require('../lib/styleCache');

const { Inline } = require('../');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const kitchenSink = {
  mediaQueries: { test: 'test' },
  activeFlex: 3,
  flex: 1,
  hoverFlex: 4,
  placeholderFlex: 2,
  placeholderHoverFlex: 5,
  testActiveFlex: 8,
  testFlex: 6,
  testHoverFlex: 9,
  testPlaceholderFlex: 7,
  testPlaceholderHoverFlex: 10,
};

describe('styleCache', () => {
  it('combines class names if `className` prop is present', () => {
    styleCache.resetCache();
    const markup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Inline, { className: 'bla', color: 'red' }, 'honk')
    );
    expect(markup).toBe('<div class="bla _1ioutjs">honk</div>');
  });

  it('generates deterministic class names', () => {
    styleCache.resetCache();
    const className = styleCache.getClassName({ wow: 'cool' });
    expect(className).toBe('_1lqd3t0');
  });

  it('returns null when given an empty style object', () => {
    styleCache.resetCache();
    const className = styleCache.getClassName({});
    expect(className).toBeNull();
  });

  it('converts a style object to a sorted object of objects', () => {
    styleCache.resetCache();
    const styles = [];
    styleCache.injectAddRule(css => styles.push(css));
    const className = styleCache.getClassName(kitchenSink);

    expect(styles).toEqual([
      `.${className} {flex:1;}`,
      `.${className}::placeholder {flex:2;}`,
      `.${className}:active {flex:3;}`,
      `.${className}:hover {flex:4;}`,
      `.${className}:hover::placeholder {flex:5;}`,
      `@media test { .${className} {flex:6;} }`,
      `@media test { .${className}::placeholder {flex:7;} }`,
      `@media test { .${className}:active {flex:8;} }`,
      `@media test { .${className}:hover {flex:9;} }`,
      `@media test { .${className}:hover::placeholder {flex:10;} }`,
    ]);
  });

  it('respects media query order', () => {
    let allCSS = '\n';
    styleCache.resetCache();
    styleCache.injectAddRule(css => (allCSS += css + '\n'));

    const className = styleCache.getClassName({
      mediaQueries: {
        zzzz: 'zzzz',
        aaaa: 'aaaa',
      },
      aaaaFlex: 3,
      flex: 1,
      zzzzFlex: 2,
    });

    expect(allCSS).toEqual(`
.${className} {flex:1;}
@media zzzz { .${className} {flex:2;} }
@media aaaa { .${className} {flex:3;} }
`);
  });

  it('works with addRule injection', () => {
    let allCSS = '\n';
    styleCache.resetCache();
    styleCache.injectAddRule(css => (allCSS += css + '\n'));

    const className = styleCache.getClassName(kitchenSink);

    expect(allCSS).toEqual(
      `
.${className} {flex:1;}
.${className}::placeholder {flex:2;}
.${className}:active {flex:3;}
.${className}:hover {flex:4;}
.${className}:hover::placeholder {flex:5;}
@media test { .${className} {flex:6;} }
@media test { .${className}::placeholder {flex:7;} }
@media test { .${className}:active {flex:8;} }
@media test { .${className}:hover {flex:9;} }
@media test { .${className}:hover::placeholder {flex:10;} }
`
    );
  });

  it('works with classname strategy injection', () => {
    styleCache.resetCache();
    let idx = -1;
    styleCache.injectClassNameStrategy(() => 'jsxstyle' + ++idx);

    const classNames = [
      styleCache.getClassName({ a: 1 }),
      styleCache.getClassName({ b: 2 }),
      styleCache.getClassName({ c: 3 }),
      styleCache.getClassName({ a: 1 }),
    ];

    expect(classNames).toEqual([
      'jsxstyle0',
      'jsxstyle1',
      'jsxstyle2',
      'jsxstyle0',
    ]);
  });
});
