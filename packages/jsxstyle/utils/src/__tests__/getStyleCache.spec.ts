import { getStyleCache } from '../getStyleCache';
import { kitchenSink } from './kitchenSink';

describe('getStyleCache', () => {
  it('combines class names if `className` prop is present', () => {
    const styleCache = getStyleCache();
    const props = styleCache.getComponentProps({
      display: 'inline',
      color: 'red',
      className: 'bla',
    });
    expect(props?.className).toMatchInlineSnapshot(`"bla _1lvn9cc _1jvcvsh"`);
  });

  it('generates deterministic class names', () => {
    const styleCache = getStyleCache();
    const props = styleCache.getComponentProps({ wow: 'cool' });
    expect(props?.className).toMatchInlineSnapshot(`"_1b8zaqn"`);
  });

  it('generates a stable classname hash for the specified style object', () => {
    const styleCache = getStyleCache();
    const props = styleCache.getComponentProps({
      color: 'red',
      display: 'block',
      hoverColor: 'green',
    });
    expect(props?.className).toMatchInlineSnapshot(
      `"_1jvcvsh _cmecz0 _hwodt1"`
    );
  });

  it('returns an object of known component props when given an object containing only those props', () => {
    const styleCache = getStyleCache();
    const insertedRules: string[] = [];
    styleCache.injectOptions({
      onInsertRule(css) {
        insertedRules.push(css);
      },
    });

    const exampleProps = {
      id: 'hello',
      name: 'test123',
    };

    const componentProps = styleCache.getComponentProps(exampleProps);
    expect(componentProps).toEqual(exampleProps);
    expect(insertedRules).toEqual([]);
  });

  it('returns a props object with a className when styles and allowed props are present', () => {
    const styleCache = getStyleCache();
    const insertedRules: string[] = [];
    styleCache.injectOptions({
      onInsertRule(css) {
        insertedRules.push(css);
      },
    });

    const componentProps = styleCache.getComponentProps({
      color: 'red',
      display: 'block',
      id: 'hello',
      name: 'test123',
    });

    expect(componentProps).toMatchInlineSnapshot(`
Object {
  "className": "_1jvcvsh _cmecz0",
  "id": "hello",
  "name": "test123",
}
`);
    expect(insertedRules).toMatchInlineSnapshot(`
Array [
  "._1jvcvsh { color:red }",
  "._cmecz0 { display:block }",
]
`);
  });

  it('works with addRule injection', () => {
    const styleCache = getStyleCache();
    const insertedRules: string[] = [];
    styleCache.injectOptions({
      onInsertRule(css) {
        insertedRules.push(css);
      },
    });

    styleCache.getComponentProps(kitchenSink);

    expect(insertedRules).toMatchInlineSnapshot(`
Array [
  "._17w4vug { margin:1px }",
  "._1m680gx._1m680gx { margin-left:3px }",
  "._tn8y8r._tn8y8r { margin-right:2px }",
  "._11qejiy._11qejiy:hover { margin-left:4px }",
  "._r23nsx._r23nsx:active { margin-top:5px }",
  "._18b6tc5._18b6tc5:active { margin-bottom:5px }",
  "._12u3iza._12u3iza::placeholder { padding-top:8px }",
  "._1njps7w._1njps7w::placeholder { padding-bottom:6px }",
  "._1kzxzhu::placeholder { padding:7px }",
  "._16aryto:hover::placeholder { color:9px }",
  "@keyframes _141dqt4 { from { color:red; padding-left:69px; padding-right:69px } to { margin-top:123px; margin-bottom:123px; margin:456px } }",
  "._141dqt4._141dqt4 { animation-name:_141dqt4 }",
  "@keyframes _1feg296 { test { margin:456px; margin-top:123px; margin-bottom:123px } }",
  "._1feg296._1feg296:hover { animation-name:_1feg296 }",
]
`);
  });

  it('works with classname strategy injection', () => {
    const styleCache = getStyleCache();
    let idx = -1;
    styleCache.injectOptions({ getClassName: () => 'jsxstyle' + ++idx });

    const classNames = [
      styleCache.getComponentProps({ a: 1 })?.className,
      styleCache.getComponentProps({ b: 2 })?.className,
      styleCache.getComponentProps({ c: 3 })?.className,
      styleCache.getComponentProps({ a: 1 })?.className,
    ];

    expect(classNames).toEqual([
      'jsxstyle0',
      'jsxstyle1',
      'jsxstyle2',
      'jsxstyle0',
    ]);
  });

  it('resets', () => {
    const styleCache = getStyleCache();
    let idx = -1;
    styleCache.injectOptions({ getClassName: () => 'jsxstyle' + ++idx });

    expect(styleCache.getComponentProps({ a: 1 })?.className).toEqual(
      'jsxstyle0'
    );
    expect(styleCache.getComponentProps({ a: 1 })?.className).toEqual(
      'jsxstyle0'
    );
    styleCache.reset();
    expect(styleCache.getComponentProps({ a: 1 })?.className).toEqual(
      'jsxstyle1'
    );
  });

  it('throws an errors when injections are added incorrectly', () => {
    const styleCache = getStyleCache();

    expect(() => styleCache.injectOptions()).not.toThrow();

    // no repeated injections
    expect(() => styleCache.injectOptions()).toThrowErrorMatchingInlineSnapshot(
      `"jsxstyle error: \`injectOptions\` should be called once and only once."`
    );

    styleCache.getComponentProps({ a: 1 });

    // no injections after getComponentProps is called
    expect(() => styleCache.injectOptions()).toThrowErrorMatchingInlineSnapshot(
      `"jsxstyle error: \`injectOptions\` must be called before any jsxstyle components mount."`
    );
  });
});
