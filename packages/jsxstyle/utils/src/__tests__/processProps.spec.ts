import { processProps } from '../processProps';
import { kitchenSink } from './kitchenSink';
import { createClassNameGetter } from '../createClassNameGetter';

const runProcessProps = (...args: Parameters<typeof processProps>) => {
  const rules: string[] = [];
  const onInsertRule = (rule: string) => rules.push(rule);
  const props = processProps(args[0], args[1], args[2], onInsertRule, args[4]);
  return { props, rules };
};

describe('processProps', () => {
  it('returns empty rules and props when given an empty props object', () => {
    const keyObj = runProcessProps({}, 'className', createClassNameGetter({}));
    expect(keyObj).toEqual({
      props: {},
      rules: [],
    });
  });

  it('returns empty rules and a props object when only given known component props', () => {
    const propsObject = { id: 'hello', onBanana: true };
    const keyObj = runProcessProps(
      propsObject,
      'className',
      createClassNameGetter({})
    );
    expect(keyObj.props).toEqual(propsObject);
    expect(keyObj.rules).toEqual([]);
  });

  it('separates component props and styles', () => {
    const keyObj1 = runProcessProps(
      kitchenSink,
      'className',
      createClassNameGetter({})
    );

    expect(keyObj1).toMatchInlineSnapshot(`
Object {
  "props": Object {
    "className": "_x0 _x1 _x2 _x3 _x4 _x5 _x6 _x7 _x8 _x9 _xa _xb",
    "disabled": true,
    "href": "https://jsx.style",
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
    "@keyframes _xa { from { color:red; padding-left:69px; padding-right:69px } to { margin-top:123px; margin-bottom:123px; margin:456px } }",
    "._xa._xa { animation-name:_xa }",
    "@keyframes _xb { test { margin:456px; margin-top:123px; margin-bottom:123px } }",
    "._xb._xb:hover { animation-name:_xb }",
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

    const keyObj = runProcessProps(
      styleObj,
      'className',
      createClassNameGetter({})
    );

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

  it('ignores empty animation objects', () => {
    const styleObj = {
      color: 'red',
      animation: {},
    };

    const { rules } = runProcessProps(
      styleObj,
      'className',
      createClassNameGetter({})
    );

    expect(rules).toMatchInlineSnapshot(`
Array [
  "._x0 { color:red }",
]
`);
  });

  it('logs an error when it encounters pseudo-prefixed props in object-type animation syntax', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const styleObj = {
      color: 'red',
      animation: {
        from: { activePadding: 0 },
        to: { padding: 123 },
      },
    };

    const { rules } = runProcessProps(
      styleObj,
      'className',
      createClassNameGetter({})
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

    const { rules: rules1 } = runProcessProps(
      {
        color: 'red',
        animation: {
          thing1: {},
          thing2: { padding: 123 },
        },
      },
      'className',
      createClassNameGetter({})
    );

    const { rules: rules2 } = runProcessProps(
      {
        color: 'red',
        animation: {
          thing1: { padding: null },
          thing2: { padding: 123 },
        },
      },
      'className',
      createClassNameGetter({})
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

  it('manages specificity', () => {
    const styleObject = {
      margin: 10,
      marginLeft: 30,
      activeMargin: 40,
      activeMarginLeft: 50,
      placeholderHoverMargin: 60,
      placeholderHoverMarginLeft: 70,
    };

    const getClassName = createClassNameGetter({});

    const { rules } = runProcessProps(styleObject, 'className', getClassName);

    const { rules: mediaQueryRules } = runProcessProps(
      styleObject,
      'className',
      getClassName,
      undefined,
      'example'
    );

    expect([...rules, ...mediaQueryRules]).toMatchInlineSnapshot(`
Array [
  "._x0 { margin:10px }",
  "._x1._x1 { margin-left:30px }",
  "._x2:active { margin:40px }",
  "._x3._x3:active { margin-left:50px }",
  "._x4:hover::placeholder { margin:60px }",
  "._x5._x5:hover::placeholder { margin-left:70px }",
  "@media example { ._x6._x6._x6 { margin:10px } }",
  "@media example { ._x7._x7._x7._x7 { margin-left:30px } }",
  "@media example { ._x8._x8._x8:active { margin:40px } }",
  "@media example { ._x9._x9._x9._x9:active { margin-left:50px } }",
  "@media example { ._xa._xa._xa:hover::placeholder { margin:60px } }",
  "@media example { ._xb._xb._xb._xb:hover::placeholder { margin-left:70px } }",
]
`);
  });
});
