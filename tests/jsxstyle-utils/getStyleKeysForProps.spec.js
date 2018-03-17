import { getStyleKeysForProps } from 'jsxstyle-utils';

describe('getStyleKeysForProps', () => {
  it('returns null when given an empty style object', () => {
    const keyObj = getStyleKeysForProps({});
    expect(keyObj).toBeNull();
  });

  it('converts a style object to a style string that only contains valid styles', () => {
    function Useless(stuff) {
      this.stuff = stuff;
    }

    Object.assign(Useless.prototype, {
      toString() {
        return this.stuff;
      },
    });

    function prototypeTest(stuff) {
      return new Useless(stuff);
    }

    const keyObj = getStyleKeysForProps(
      {
        prop1: 'string',
        prop2: 1234,
        prop3: 0,
        prop4: prototypeTest('wow'),
        prop5: null,
        prop6: undefined,
        prop7: false,
      },
      true
    );

    expect(keyObj).toEqual({
      '.': {
        styles: `
  prop1: string;
  prop2: 1234px;
  prop3: 0;
  prop4: wow;
`,
      },
      classNameKey: 'prop1:string;prop2:1234px;prop3:0;prop4:wow;',
    });
  });

  it('splits out pseudoelements and pseudoclasses', () => {
    const keyObj = getStyleKeysForProps(
      {
        selectionBackgroundColor: 'red',
        placeholderColor: 'blue',
        hoverColor: 'orange',
        activeColor: 'purple',
      },
      false
    );

    expect(keyObj).toEqual({
      '.::placeholder': {
        pseudoelement: 'placeholder',
        styles: 'color:blue;',
      },
      '.::selection': {
        pseudoelement: 'selection',
        styles: 'background-color:red;',
      },
      '.:active': {
        pseudoclass: 'active',
        styles: 'color:purple;',
      },
      '.:hover': {
        pseudoclass: 'hover',
        styles: 'color:orange;',
      },
      classNameKey:
        'activeColor:purple;hoverColor:orange;placeholderColor:blue;selectionBackgroundColor:red;',
    });
  });

  it('generates identical classNameKeys for identical styles objects', () => {
    const keyObj1 = getStyleKeysForProps(
      { color: 'red', fooColor: 'blue', mediaQueries: { foo: 'test mq' } },
      false
    );

    const keyObj2 = getStyleKeysForProps(
      { color: 'red', barColor: 'blue', mediaQueries: { bar: 'test mq' } },
      false
    );

    expect(keyObj1.classNameKey).toEqual('color:red;@test mq~color:blue;');
    expect(keyObj1.classNameKey).toEqual(keyObj2.classNameKey);
  });

  it('generates different classNameKeys for styles objects with different content', () => {
    const keyObj1 = getStyleKeysForProps(
      { color: 'red', fooColor: 'blue', mediaQueries: { foo: 'test mq1' } },
      false
    );

    const keyObj2 = getStyleKeysForProps(
      { color: 'red', fooColor: 'blue', mediaQueries: { foo: 'test mq2' } },
      false
    );

    expect(keyObj1.classNameKey).toEqual('color:red;@test mq1~color:blue;');
    expect(keyObj2.classNameKey).toEqual('color:red;@test mq2~color:blue;');
  });

  it.skip('generates identical classNameKeys for style objects with duplicate media queries', () => {
    const mediaQueries = { foo: 'test mq', bar: 'test mq' };

    const keyObj1 = getStyleKeysForProps(
      { fooProp1: 'blue', barProp2: 'red', mediaQueries },
      false
    );

    const keyObj2 = getStyleKeysForProps(
      { barProp1: 'blue', fooProp2: 'red', mediaQueries },
      false
    );

    expect(keyObj1.classNameKey).toEqual('@test mq~prop2:red;prop1:blue;');
    expect(keyObj1.classNameKey).toEqual(keyObj2.classNameKey);
  });
});
