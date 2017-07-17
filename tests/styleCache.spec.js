'use strict';

const styleCache = require('../lib/styleCache');

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
  it('returns null when given an empty style object', () => {
    const markup = styleCache.getClassName({});
    expect(markup).toBeNull();
  });

  it('converts a style object to a sorted object of objects', () => {
    const className = styleCache.getClassName(kitchenSink);
    const styleElement = document.querySelector('style');
    const styles = Array.from(styleElement.sheet.cssRules).map(f => f.cssText);

    expect(styles).toEqual([
      '._16u1swz {flex: 1;}',
      '._16u1swz::placeholder {flex: 2;}',
      '._16u1swz:active {flex: 3;}',
      '._16u1swz:hover {flex: 4;}',
      '._16u1swz:hover::placeholder {flex: 5;}',
      '@media test {._16u1swz {flex: 6;}}',
      '@media test {._16u1swz::placeholder {flex: 7;}}',
      '@media test {._16u1swz:active {flex: 8;}}',
      '@media test {._16u1swz:hover {flex: 9;}}',
      '@media test {._16u1swz:hover::placeholder {flex: 10;}}',
    ]);
    expect(className).toEqual('_16u1swz');

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
.${className} {
  flex: 1;
}
@media zzzz { .${className} {
  flex: 2;
} }
@media aaaa { .${className} {
  flex: 3;
} }
`);
  });

  it('works with injection', () => {
    let allCSS = '\n';
    styleCache.resetCache();
    styleCache.injectAddRule(css => (allCSS += css + '\n'));

    const className = styleCache.getClassName(kitchenSink);

    expect(allCSS).toEqual(
      `
._16u1swz {
  flex: 1;
}
._16u1swz::placeholder {
  flex: 2;
}
._16u1swz:active {
  flex: 3;
}
._16u1swz:hover {
  flex: 4;
}
._16u1swz:hover::placeholder {
  flex: 5;
}
@media test { ._16u1swz {
  flex: 6;
} }
@media test { ._16u1swz::placeholder {
  flex: 7;
} }
@media test { ._16u1swz:active {
  flex: 8;
} }
@media test { ._16u1swz:hover {
  flex: 9;
} }
@media test { ._16u1swz:hover::placeholder {
  flex: 10;
} }
`
    );
    expect(className).toEqual('_16u1swz');
  });
});
