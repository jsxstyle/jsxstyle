'use strict';

const getClassNameStringFromProps = require('../lib/getClassNameStringFromProps');

describe('getClassNameStringFromProps', () => {
  it('returns null when given an empty style object', () => {
    const markup = getClassNameStringFromProps({});
    expect(markup).toBeNull();
  });

  it('converts a style object to a sorted object of objects', () => {
    const className = getClassNameStringFromProps({
      mediaQueries: { test: 'test' },
      width: 'first',
      placeholderWidth: 'third',
      testWidth: 'second',
      testPlaceholderWidth: 'fourth',
    });

    const styleElement = document.querySelector('style');

    const styles = Array.from(styleElement.sheet.cssRules).map(f => f.cssText);

    expect(styles).toEqual([
      `.${className} {width: first;}`,
      `.${className}::placeholder {width: third;}`,
      `@media test {.${className}::placeholder {width: fourth;}}`,
      `@media test {.${className} {width: second;}}`,
    ]);
  });
});
