import { getStyleCache } from '..';

const kitchenSink = {
  activeFlex: 3,
  flex: 1,
  hoverFlex: 4,
  mediaQueries: { test: 'test' },
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
    const styleCache = getStyleCache();
    const className = styleCache.getClassName(
      { display: 'inline', color: 'red' },
      'bla'
    );
    expect(className).toBe('bla _1ioutjs');
  });

  it('generates deterministic class names', () => {
    const styleCache = getStyleCache();
    const className = styleCache.getClassName({ wow: 'cool' });
    expect(className).toBe('_1lqd3t0');
  });

  it('generates a classname hash of `_d3bqdr` for the specified style object', () => {
    const styleCache = getStyleCache();
    const className = styleCache.getClassName({
      color: 'red',
      display: 'block',
      hoverColor: 'green',
      mediaQueries: {
        test: 'example media query',
      },
      testActiveColor: 'blue',
    });
    expect(className).toEqual('_d3bqdr');
  });

  it('returns null when given an empty style object', () => {
    const styleCache = getStyleCache();
    const className = styleCache.getClassName({});
    expect(className).toBeNull();
  });

  it('converts a style object to a sorted object of objects', () => {
    const styleCache = getStyleCache();
    const styles: string[] = [];
    styleCache.injectOptions({
      onInsertRule: (css) => {
        styles.push(css);
      },
    });
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
    // tslint:disable object-literal-sort-keys
    let allCSS = '\n';
    const styleCache = getStyleCache();
    styleCache.injectOptions({
      onInsertRule: (css) => {
        allCSS += css + '\n';
      },
    });

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
    // tslint:enable object-literal-sort-keys
  });

  it('works with addRule injection', () => {
    let allCSS = '\n';
    const styleCache = getStyleCache();
    styleCache.injectOptions({
      onInsertRule: (css) => {
        allCSS += css + '\n';
      },
    });

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
    const styleCache = getStyleCache();
    let idx = -1;
    styleCache.injectOptions({ getClassName: () => 'jsxstyle' + ++idx });

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

  it('resets', () => {
    const styleCache = getStyleCache();
    let idx = -1;
    styleCache.injectOptions({ getClassName: () => 'jsxstyle' + ++idx });

    expect(styleCache.getClassName({ a: 1 })).toEqual('jsxstyle0');
    expect(styleCache.getClassName({ a: 1 })).toEqual('jsxstyle0');
    styleCache.reset();
    expect(styleCache.getClassName({ a: 1 })).toEqual('jsxstyle1');
  });

  // prettier-ignore
  it('throws an errors when injections are added incorrectly', () => {
    const styleCache = getStyleCache();

    const alreadyInjectedMsg = 'jsxstyle error: `injectOptions` should be called once and only once.';
    const cannotInjectMsg = 'jsxstyle error: `injectOptions` must be called before any jsxstyle components mount.';

    expect(() => styleCache.injectOptions()).not.toThrow();

    // no repeated injections
    expect(() => styleCache.injectOptions()).toThrowError(alreadyInjectedMsg);

    styleCache.getClassName({ a: 1 });

    // no injections after getClassName is called
    expect(() => styleCache.injectOptions()).toThrowError(cannotInjectMsg);
  });
});
