import { StyleCache } from '../getStyleCache';
import { kitchenSink } from './kitchenSink';

describe('StyleCache', () => {
  it('combines class names if `className` prop is present', () => {
    const styleCache = new StyleCache();
    const props = styleCache.getComponentProps(
      {
        display: 'inline',
        color: 'red',
        className: 'bla',
      },
      'className'
    );
    expect(props?.className).toMatchInlineSnapshot(`"bla _1lvn9cc _1jvcvsh"`);
  });

  it('generates deterministic class names', () => {
    const styleCache = new StyleCache();
    const props = styleCache.getComponentProps({ wow: 'cool' }, 'className');
    expect(props?.className).toMatchInlineSnapshot(`"_1b8zaqn"`);
  });

  it('generates a stable classname hash for the specified style object', () => {
    const styleCache = new StyleCache();
    const props = styleCache.getComponentProps(
      {
        color: 'red',
        display: 'block',
        hoverColor: 'green',
      },
      'className'
    );
    expect(props?.className).toMatchInlineSnapshot(
      `"_1jvcvsh _cmecz0 _hwodt1"`
    );
  });

  it('returns an object of known component props when given an object containing only those props', () => {
    const styleCache = new StyleCache();
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

    const componentProps = styleCache.getComponentProps(
      exampleProps,
      'className'
    );
    expect(componentProps).toEqual(exampleProps);
    expect(insertedRules).toEqual([]);
  });

  it('returns a props object with a className when styles and allowed props are present', () => {
    const styleCache = new StyleCache();
    const insertedRules: string[] = [];
    styleCache.injectOptions({
      onInsertRule(css) {
        insertedRules.push(css);
      },
    });

    const componentProps = styleCache.getComponentProps(
      {
        color: 'red',
        display: 'block',
        id: 'hello',
        name: 'test123',
      },
      'className'
    );

    expect(componentProps).toMatchInlineSnapshot(`
      {
        "className": "_1jvcvsh _cmecz0",
        "id": "hello",
        "name": "test123",
      }
    `);
    expect(insertedRules).toMatchInlineSnapshot(`
      [
        "._1jvcvsh{color:red}",
        "._cmecz0{display:block}",
      ]
    `);
  });

  it('works with addRule injection', () => {
    const styleCache = new StyleCache();
    const insertedRules: string[] = [];
    styleCache.injectOptions({
      onInsertRule(css) {
        insertedRules.push(css);
      },
    });

    styleCache.getComponentProps(kitchenSink, 'className');

    expect(insertedRules).toMatchInlineSnapshot(`
      [
        "._17w4vug{margin:1px}",
        "._1m680gx._1m680gx{margin-left:3px}",
        "._tn8y8r._tn8y8r{margin-right:2px}",
        "._11qejiy._11qejiy:hover{margin-left:4px}",
        "._r23nsx._r23nsx:active{margin-top:5px}",
        "._18b6tc5._18b6tc5:active{margin-bottom:5px}",
        "._12u3iza._12u3iza::placeholder{padding-top:8px}",
        "._1njps7w._1njps7w::placeholder{padding-bottom:6px}",
        "._1kzxzhu::placeholder{padding:7px}",
        "._16aryto:hover::placeholder{color:9px}",
        "@keyframes _yk2kzc{from{color:red;padding-left:69px;padding-right:69px}to{margin-top:123px;margin-bottom:123px;margin:456px}}",
        "._yk2kzc._yk2kzc{animation-name:_yk2kzc}",
        "@keyframes _1nz5one{test{margin:456px;margin-top:123px;margin-bottom:123px}}",
        "._1nz5one._1nz5one:hover{animation-name:_1nz5one}",
      ]
    `);
  });

  it('works with classname strategy injection', () => {
    const styleCache = new StyleCache();
    let idx = -1;
    styleCache.injectOptions({ getClassName: () => 'jsxstyle' + ++idx });

    const classNames = [
      styleCache.getComponentProps({ a: 1 }, 'className')?.className,
      styleCache.getComponentProps({ b: 2 }, 'className')?.className,
      styleCache.getComponentProps({ c: 3 }, 'className')?.className,
      styleCache.getComponentProps({ a: 1 }, 'className')?.className,
    ];

    expect(classNames).toEqual([
      'jsxstyle0',
      'jsxstyle1',
      'jsxstyle2',
      'jsxstyle0',
    ]);
  });

  it('resets', () => {
    let idx = -1;
    const styleCache = new StyleCache({
      getClassName: () => 'jsxstyle' + ++idx,
    });

    expect(
      styleCache.getComponentProps({ a: 1 }, 'className')?.className
    ).toEqual('jsxstyle0');
    expect(
      styleCache.getComponentProps({ a: 1 }, 'className')?.className
    ).toEqual('jsxstyle0');
    styleCache.reset();
    expect(
      styleCache.getComponentProps({ a: 1 }, 'className')?.className
    ).toEqual('jsxstyle1');
  });

  it('throws an errors when injections are added incorrectly', () => {
    const styleCache = new StyleCache();

    expect(() => styleCache.injectOptions({})).not.toThrow();

    // no repeated injections
    expect(() =>
      styleCache.injectOptions({})
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: jsxstyle error: \`injectOptions\` must be called once, before any jsxstyle components mount.]`
    );

    styleCache.getComponentProps({ a: 1 }, 'className');

    // no injections after getComponentProps is called
    expect(() =>
      styleCache.injectOptions({})
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: jsxstyle error: \`injectOptions\` must be called once, before any jsxstyle components mount.]`
    );
  });

  describe('run', () => {
    it('works with synchronous callbacks', async () => {
      const styleCache = new StyleCache();

      await expect(
        styleCache.run(() => {
          return [
            styleCache.getComponentProps({ color: 'red' }, 'x')?.x,
            styleCache.getComponentProps({ color: 'blue' }, 'x')?.x,
            styleCache.getComponentProps({ color: 'red' }, 'x')?.x,
          ];
        })
      ).resolves.toMatchInlineSnapshot(`
        {
          "css": "._1jvcvsh{color:red}._1mb383g{color:blue}",
          "returnValue": [
            "_1jvcvsh",
            "_1mb383g",
            "_1jvcvsh",
          ],
        }
      `);

      expect(styleCache.classNameCache).toMatchInlineSnapshot(`
        {
          "color:blue": "_1mb383g",
          "color:red": "_1jvcvsh",
        }
      `);
      expect(styleCache.insertRuleCache).toMatchInlineSnapshot(`
        {
          "._1jvcvsh{color:red}": true,
          "._1mb383g{color:blue}": true,
        }
      `);
    });

    it('works with asynchronous callbacks', async () => {
      const styleCache = new StyleCache();

      await expect(
        styleCache.run(() => {
          return [
            styleCache.getComponentProps({ color: 'red' }, 'x')?.x,
            styleCache.getComponentProps({ color: 'blue' }, 'x')?.x,
            styleCache.getComponentProps({ color: 'red' }, 'x')?.x,
          ];
        })
      ).resolves.toMatchInlineSnapshot(`
        {
          "css": "._1jvcvsh{color:red}._1mb383g{color:blue}",
          "returnValue": [
            "_1jvcvsh",
            "_1mb383g",
            "_1jvcvsh",
          ],
        }
      `);

      expect(styleCache.classNameCache).toMatchInlineSnapshot(`
        {
          "color:blue": "_1mb383g",
          "color:red": "_1jvcvsh",
        }
      `);
      expect(styleCache.insertRuleCache).toMatchInlineSnapshot(`
        {
          "._1jvcvsh{color:red}": true,
          "._1mb383g{color:blue}": true,
        }
      `);
    });

    it('allows class names to be customised', async () => {
      const styleCache = new StyleCache();
      let index = 0;

      await expect(
        styleCache.run(
          async () => {
            return [
              styleCache.getComponentProps({ color: 'red' }, 'x')?.x,
              styleCache.getComponentProps({ color: 'blue' }, 'x')?.x,
              styleCache.getComponentProps({ color: 'red' }, 'x')?.x,
            ];
          },
          () => 'test' + (index++).toString(36)
        )
      ).resolves.toMatchInlineSnapshot(`
        {
          "css": ".test0{color:red}.test1{color:blue}",
          "returnValue": [
            "test0",
            "test1",
            "test0",
          ],
        }
      `);

      expect(styleCache.classNameCache).toMatchInlineSnapshot(`
        {
          "color:blue": "test1",
          "color:red": "test0",
        }
      `);
      expect(styleCache.insertRuleCache).toMatchInlineSnapshot(`
        {
          ".test0{color:red}": true,
          ".test1{color:blue}": true,
        }
      `);
    });
  });
});
