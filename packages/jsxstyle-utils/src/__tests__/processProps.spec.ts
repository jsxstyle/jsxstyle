import { processProps } from '../processProps';

const createClassNameGetter = () => {
  let index = -1;
  const cache: Record<string, number> = {};
  return (key: string) => {
    cache[key] = cache[key] || ++index;
    return '_x' + cache[key];
  };
};

describe('processProps', () => {
  it('returns empty rules and props when given an empty props object', () => {
    const keyObj = processProps({}, 'className', createClassNameGetter());
    expect(keyObj).toEqual({
      props: {},
      rules: [],
    });
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

    const keyObj = processProps(
      {
        prop1: 'string',
        prop2: 1234,
        prop3: 0,
        prop4: prototypeTest('wow'),
        prop5: null,
        prop6: undefined,
        prop7: false,
      },
      'className',
      createClassNameGetter()
    );

    expect(keyObj).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0 _x1 _x2 _x3",
  },
  "rules": Array [
    "._x0 { prop1:string }",
    "._x1 { prop2:1234px }",
    "._x2 { prop3:0 }",
    "._x3 { prop4:wow }",
  ],
}
`);
  });

  it('uses classNamePropKey to set className prop', () => {
    const classNameKeyObj = processProps(
      { color: 'purple' },
      'className',
      createClassNameGetter()
    );

    const bananaKeyObj = processProps(
      { color: 'purple' },
      'banana',
      createClassNameGetter()
    );

    expect(Object.keys(classNameKeyObj?.props!)).toEqual(['className']);
    expect(Object.keys(bananaKeyObj?.props!)).toEqual(['banana']);
  });

  it('splits out pseudoelements and pseudoclasses', () => {
    const keyObj = processProps(
      {
        activeColor: 'purple',
        hoverColor: 'orange',
        placeholderColor: 'blue',
        selectionBackgroundColor: 'red',
      },
      'className',
      createClassNameGetter()
    );

    expect(keyObj).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0 _x1 _x2 _x3",
  },
  "rules": Array [
    "._x0:active { color:purple }",
    "._x1:hover { color:orange }",
    "._x2::placeholder { color:blue }",
    "._x3._x3::selection { background-color:red }",
  ],
}
`);
  });

  it('splits out allowlisted props', () => {
    const keyObj = processProps(
      {
        name: 'name prop',
        id: 'id prop',
        href: 'https://jsx.style',
      },
      'className',
      createClassNameGetter()
    );

    expect(keyObj).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "href": "https://jsx.style",
    "id": "id prop",
    "name": "name prop",
  },
  "rules": Array [],
}
`);
  });

  it('splits out props starting with `on`', () => {
    const keyObj = processProps(
      {
        // these props will be passed through as component props
        onBanana: 'purple',
        onClick: () => null,
        onNonExistentEventHandler: 123,

        // this should be considered a style
        ontological: 456,
      },
      'className',
      createClassNameGetter()
    );

    expect(keyObj).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0",
    "onBanana": "purple",
    "onClick": [Function],
    "onNonExistentEventHandler": 123,
  },
  "rules": Array [
    "._x0 { ontological:456px }",
  ],
}
`);
  });

  it('expands horizontal/vertical margin/padding shorthand props', () => {
    const keyObj1 = processProps(
      {
        margin: 1,
        marginH: 2,
        marginLeft: 3,
      },
      'className',
      createClassNameGetter()
    );

    expect(keyObj1).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0 _x1 _x2",
  },
  "rules": Array [
    "._x0 { margin:1px }",
    "._x1._x1 { margin-left:3px }",
    "._x2._x2 { margin-right:2px }",
  ],
}
`);
  });

  it('supports pseudo-prefixed horizontal/vertical margin/padding shorthand props', () => {
    const keyObj1 = processProps(
      {
        margin: 1,
        marginH: 2,
        marginLeft: 3,
        hoverMarginLeft: 4,
        activeMarginV: 5,
        placeholderPaddingV: 6,
        placeholderPadding: 7,
        placeholderPaddingTop: 8,
        placeholderHoverColor: 9,
      },
      'className',
      createClassNameGetter()
    );

    expect(keyObj1).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0 _x1 _x2 _x3 _x4 _x5 _x6 _x7 _x8 _x9",
  },
  "rules": Array [
    "._x0 { margin:1px }",
    "._x1._x1 { margin-left:3px }",
    "._x2._x2 { margin-right:2px }",
    "._x3._x3:hover { margin-left:4px }",
    "._x4._x4:active { margin-top:5px }",
    "._x5._x5:active { margin-bottom:5px }",
    "._x6._x6::placeholder { padding-top:8px }",
    "._x7._x7::placeholder { padding-bottom:6px }",
    "._x8::placeholder { padding:7px }",
    "._x9:hover::placeholder { color:9px }",
  ],
}
`);
  });

  it('supports object-type animation syntax', () => {
    const styleObj = {
      color: 'red',
      animation: {
        from: { opacity: 0 },
        to: { padding: 123 },
      },
    };

    const keyObj = processProps(styleObj, 'className', createClassNameGetter());

    expect(keyObj).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0 _x1",
  },
  "rules": Array [
    "._x0 { color:red }",
    "@keyframes _x1 { from { opacity:0 } to { padding:123px } }",
    "._x1._x1 { animation-name:_x1 }",
  ],
}
`);
  });

  it('does not support pseudo-prefixed props in object-type animation syntax', () => {
    const styleObj = {
      color: 'red',
      animation: {
        from: { activePadding: 0 },
        to: { padding: 123 },
      },
    };

    const keyObj = processProps(styleObj, 'className', createClassNameGetter());

    expect(keyObj).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0",
  },
  "rules": Array [
    "._x0 { color:red }",
  ],
}
`);
  });

  it('does not support pseudo-prefixed props in object-type animation syntax', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const styleObj = {
      color: 'red',
      animation: {
        from: { activePadding: 0 },
        to: { padding: 123 },
      },
    };

    const { rules } = processProps(
      styleObj,
      'className',
      createClassNameGetter()
    );

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  "[jsxstyle] Encountered a pseudo-prefixed prop in animation value: %s%s%s",
  "padding",
  "",
  ":active",
]
`);

    expect(rules).toMatchInlineSnapshot(`
Array [
  "._x0 { color:red }",
]
`);
    consoleSpy.mockRestore();
  });

  it('logs an error when it encounters empty/invalid style objects in object-type animation syntax', () => {
    const consoleSpy = jest.spyOn(console, 'error');

    const { rules: rules1 } = processProps(
      {
        color: 'red',
        animation: {
          thing1: {},
          thing2: { padding: 123 },
        },
      },
      'className',
      createClassNameGetter()
    );

    const { rules: rules2 } = processProps(
      {
        color: 'red',
        animation: {
          thing1: { padding: null },
          thing2: { padding: 123 },
        },
      },
      'className',
      createClassNameGetter()
    );

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "[jsxstyle] Animation value \`%s\` contained no valid style props:",
    "thing1",
    Object {},
  ],
  Array [
    "[jsxstyle] Animation value \`%s\` contained no valid style props:",
    "thing1",
    Object {
      "padding": null,
    },
  ],
]
`);

    expect(rules1).toMatchInlineSnapshot(`
Array [
  "._x0 { color:red }",
]
`);

    expect(rules2).toMatchInlineSnapshot(`
Array [
  "._x0 { color:red }",
]
`);

    consoleSpy.mockRestore();
  });
});
