import { createClassNameGetter } from '../createClassNameGetter';

describe('createClassNameGetter', () => {
  it('generates non-deterministic classNames when classNameFormat left unset', () => {
    const cacheObject = {};

    const getClassNameForKey = createClassNameGetter(cacheObject);

    getClassNameForKey('one');
    getClassNameForKey('two');
    getClassNameForKey('three');
    getClassNameForKey('one');

    expect(cacheObject).toMatchInlineSnapshot(`
      {
        "one": "_x0",
        "three": "_x2",
        "two": "_x1",
        Symbol(counter): 3,
      }
    `);
  });

  it('generates deterministic classNames when classNameFormat is set to "hash"', () => {
    const cacheObject = {};

    const getClassNameForKey = createClassNameGetter(cacheObject, 'hash');

    getClassNameForKey('one');
    getClassNameForKey('two');
    getClassNameForKey('three');
    getClassNameForKey('one');

    expect(cacheObject).toMatchInlineSnapshot(`
      {
        "one": "_375csh",
        "three": "_2qcld7",
        "two": "_375oq1",
      }
    `);
  });
});
