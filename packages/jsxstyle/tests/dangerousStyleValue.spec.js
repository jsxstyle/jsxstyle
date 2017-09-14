import dangerousStyleValue from '../src/dangerousStyleValue';

describe('dangerousStyleValue', () => {
  it('adds a px prefix to whitelisted unitless values', () => {
    const value = dangerousStyleValue('width', 415);
    expect(value).toEqual('415px');
  });

  it('does not add a px prefix to props not on the whitelist', () => {
    const value = dangerousStyleValue('flexGrow', 415);
    expect(value).toEqual('415');
  });

  it('converts fractional number values to percentages', () => {
    const value = dangerousStyleValue('width', 3 / 5);
    expect(value).toEqual('60%');
  });

  it('rounds fractional number values to a percentage', () => {
    const value = dangerousStyleValue('width', 2 / 3);
    expect(value).toEqual('66.6667%');
  });
});
