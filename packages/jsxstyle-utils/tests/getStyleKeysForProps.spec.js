import getStyleKeysForProps from '../src/getStyleKeysForProps';

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

  it('splits out pseudoelements and pseudoclasses', function() {
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
});
