import { dangerousStyleValue } from '..';

describe('dangerousStyleValue', () => {
  it('leaves the `px` prefix off known unitless prop values', () => {
    const value = dangerousStyleValue('flexGrow', 415);
    expect(value).toEqual('415');
  });

  it('adds a `px` prefix to all other numeric prop values', () => {
    const value = dangerousStyleValue('width', 415);
    expect(value).toEqual('415px');
  });

  it('converts fractional number values to percentages', () => {
    const value = dangerousStyleValue('width', 3 / 5);
    expect(value).toEqual('60%');
  });

  it('rounds fractional number values to four decimal places', () => {
    const value = dangerousStyleValue('width', 2 / 3);
    expect(value).toEqual('66.6667%');
  });

  it('returns an empty string for invalid properties', () => {
    const value1 = dangerousStyleValue('nullPrototype', Object.create(null));
    expect(value1).toEqual('');

    const value2 = dangerousStyleValue('boolean', true);
    expect(value2).toEqual('');

    const value3 = dangerousStyleValue('undefined', undefined);
    expect(value3).toEqual('');
  });
});
