import { getStyleKeysForProps } from '..';

describe('getStyleKeysForProps', () => {
  it('returns null when given an empty style object', () => {
    const keyObj = getStyleKeysForProps({});
    expect(keyObj).toBeNull();
  });

  it('converts a style object to a style string that only contains valid styles', () => {
    class Useless {
      constructor(public stuff: string) {}
      toString(): string {
        return this.stuff;
      }
    }

    function prototypeTest(stuff: string) {
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

    expect(keyObj).toMatchInlineSnapshot(`
      Object {
        "classNameKey": "prop1:string;prop2:1234px;prop3:0;prop4:wow;",
        "stylesByKey": Object {
          ".": Object {
            "styles": "
        prop1: string;
        prop2: 1234px;
        prop3: 0;
        prop4: wow;
      ",
          },
        },
      }
    `);
  });

  it('splits out pseudoelements and pseudoclasses', () => {
    const keyObj = getStyleKeysForProps(
      {
        activeColor: 'purple',
        hoverColor: 'orange',
        placeholderColor: 'blue',
        selectionBackgroundColor: 'red',
      },
      false
    );

    expect(keyObj).toMatchInlineSnapshot(`
      Object {
        "classNameKey": "activeColor:purple;hoverColor:orange;placeholderColor:blue;selectionBackgroundColor:red;",
        "stylesByKey": Object {
          ".::placeholder": Object {
            "pseudoelement": "placeholder",
            "styles": "color:blue;",
          },
          ".::selection": Object {
            "pseudoelement": "selection",
            "styles": "background-color:red;",
          },
          ".:active": Object {
            "pseudoclass": "active",
            "styles": "color:purple;",
          },
          ".:hover": Object {
            "pseudoclass": "hover",
            "styles": "color:orange;",
          },
        },
      }
    `);
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

    expect(keyObj1?.classNameKey).toEqual('color:red;@test mq~color:blue;');
    expect(keyObj1?.classNameKey).toEqual(keyObj2?.classNameKey);
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

    expect(keyObj1?.classNameKey).toEqual('color:red;@test mq1~color:blue;');
    expect(keyObj2?.classNameKey).toEqual('color:red;@test mq2~color:blue;');
  });

  it('expands horizontal/vertical margin/padding shorthand props', () => {
    const keyObj1 = getStyleKeysForProps({
      aaa: 123,
      zzz: 123,
      margin: 1, // least specific
      marginH: 2, // expands to marginLeft + marginRight
      marginLeft: 3, // most specific
    });

    expect(keyObj1?.classNameKey).toEqual(
      'aaa:123px;margin:1px;marginH:2px;marginLeft:3px;zzz:123px;'
    );
  });

  it('supports pseudo-prefixed horizontal/vertical margin/padding shorthand props', () => {
    const keyObj1 = getStyleKeysForProps({
      mediaQueries: { sm: 'test' },
      margin: 1,
      marginH: 2,
      marginLeft: 3,
      // unsupported
      hoverMarginLeft: 4,
      activeMarginV: 5,
      // should be supported
      smMarginH: 6,
    });

    expect(keyObj1).toMatchInlineSnapshot(`
      Object {
        "classNameKey": "activeMarginV:5px;hoverMarginLeft:4px;margin:1px;marginH:2px;marginLeft:3px;@test~marginH:6px;",
        "stylesByKey": Object {
          ".": Object {
            "styles": "margin:1px;margin-left:2px;margin-right:2px;margin-left:3px;",
          },
          ".:active": Object {
            "pseudoclass": "active",
            "styles": "margin-top:5px;margin-bottom:5px;",
          },
          ".:hover": Object {
            "pseudoclass": "hover",
            "styles": "margin-left:4px;",
          },
          ".@1000": Object {
            "mediaQuery": "test",
            "styles": "margin-left:6px;margin-right:6px;",
          },
        },
      }
    `);
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

    expect(keyObj1?.classNameKey).toEqual('@test mq~prop2:red;prop1:blue;');
    expect(keyObj1?.classNameKey).toEqual(keyObj2?.classNameKey);
  });

  it('supports object-type animation syntax', () => {
    const styleObj = {
      color: 'red',
      animation: {
        from: { opacity: 0 },
        to: { padding: 123 },
      },
    };

    const keyObj1 = getStyleKeysForProps(styleObj, true);
    const keyObj2 = getStyleKeysForProps(styleObj, false);

    expect(keyObj1).toMatchInlineSnapshot(`
      Object {
        "animations": Object {
          "jsxstyle_14kipeq": "
      from {
        opacity: 0;
      }
      to {
        padding: 123px;
      }
      ",
        },
        "classNameKey": "animation:jsxstyle_14kipeq;color:red;",
        "stylesByKey": Object {
          ".": Object {
            "styles": "
        animation-name: jsxstyle_14kipeq;
        color: red;
      ",
          },
        },
      }
    `);

    expect(keyObj2).toMatchInlineSnapshot(`
      Object {
        "animations": Object {
          "jsxstyle_q1qr48": "from{opacity:0;}to{padding:123px;}",
        },
        "classNameKey": "animation:jsxstyle_q1qr48;color:red;",
        "stylesByKey": Object {
          ".": Object {
            "styles": "animation-name:jsxstyle_q1qr48;color:red;",
          },
        },
      }
    `);
  });
});
