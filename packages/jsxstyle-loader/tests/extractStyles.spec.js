'use strict';

const extractStyles = require('../lib/ast-utils/extractStyles');

const staticNamespace = {
  LC: {
    staticValue: 'ok',
  },
  val: 'thing',
};

describe('extractStyles', function() {
  it('converts jsxstyle elements to plain elements when all props are static', () => {
    const rv = extractStyles({
      src: '<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} />',
      sourceFileName: 'test/extract-static1.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/extract-static1.jsxstyle.css");
<div className="_x0" />`
    );
    expect(rv.css).toEqual(
      `/* test/extract-static1.js:1 (Block) */
._x0 {
  static-string:wow;
  static-int:69px;
  static-value:thing;
  static-member-expression:ok;
  display:block;
}
`
    );
  });

  it('converts jsxstyle elements to Block elements when some props aren\u2019t static', () => {
    const rv = extractStyles({
      src: '<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} dynamicValue={notStatic} />',
      sourceFileName: 'test/extract-static2.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/extract-static2.jsxstyle.css");
<Block dynamicValue={notStatic} className="_x0" />`
    );
    expect(rv.css).toEqual(
      `/* test/extract-static2.js:1 (Block) */
._x0 {
  static-string:wow;
  static-int:69px;
  static-value:thing;
  static-member-expression:ok;
}
`
    );
  });

  it('handles props mixed with spread operators', () => {
    const rv = extractStyles({
      src: `<Block doNotExtract {...spread} extract="yep" />`,
      sourceFileName: 'test/spread.js',
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require("test/spread.jsxstyle.css");
<Block doNotExtract {...spread} extract={null} className="_x0" />`
    );
    expect(rv.css).toEqual(
      `/* test/spread.js:1 (Block) */
._x0 {
  extract:yep;
}
`
    );
  });

  it('updates `cacheObject` counter and key object', () => {
    const cacheObject = {};

    extractStyles({
      src: `<Block />`,
      sourceFileName: 'test/cache-object.js',
      cacheObject,
    });

    extractStyles({
      src: `<Block staticThing="wow" />`,
      sourceFileName: 'test/cache-object.js',
      cacheObject,
    });

    extractStyles({
      src: `<InlineBlock />`,
      sourceFileName: 'test/cache-object.js',
      cacheObject,
    });

    expect(cacheObject).toEqual({
      counter: 3,
      keys: {
        'display:block;': '0',
        'display:block;staticThing:wow;': '1',
        'display:inline-block;': '2',
      },
    });
  });

  it('groups styles when a `styleGroups` object is provided', () => {
    const cacheObject = {};
    const styleGroups = {
      _test1: {
        thing: 'wow',
        hoverThing: 'ok',
      },
      _test2: {
        display: 'inline-block',
      },
    };

    const rv = extractStyles({
      src: `<Block>
  <Block thing="wow" hoverThing="ok" />
  <InlineBlock />
</Block>`,
      sourceFileName: 'test/style-groups.js',
      cacheObject,
      styleGroups,
    });

    expect(rv.js).toEqual(
      `require("test/style-groups.jsxstyle.css");
<div className="_x0">
  <div className="_test1 _x0" />
  <div className="_test2" />
</div>`
    );

    expect(rv.css).toEqual(
      `/* test/style-groups.js:1 (Block) */
/* test/style-groups.js:2 (Block) */
._x0 {
  display:block;
}
/* test/style-groups.js:2 (Block) */
._test1 {
  thing:wow;
}
._test1:hover {
  thing:ok;
}
/* test/style-groups.js:3 (InlineBlock) */
._test2 {
  display:inline-block;
}
`
    );
  });

  it('handles the `props` prop correctly', () => {
    const rv1 = extractStyles({
      src: `<Block props={{staticObject: 'yep'}} />;
<Block props={{}} />;
<Block props={variable} />;
<Block props={calledFunction()} />;
<Block props={member.expression} />;
<Block dynamic={ok} props="this should remain untouched" />;`,
      sourceFileName: 'test/props-prop1.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv1.js).toEqual(
      `require("test/props-prop1.jsxstyle.css");
<div staticObject="yep" className="_x0" />;
<div className="_x0" />;
<div {...variable} className="_x0" />;
<div {...calledFunction()} className="_x0" />;
<div {...member.expression} className="_x0" />;
<Block dynamic={ok} props="this should remain untouched" />;`
    );

    expect(() =>
      extractStyles({
        src: '<Block props="invalid" />',
        sourceFileName: 'test/props-prop2.js',
        cacheObject: {},
        staticNamespace,
      })
    ).toThrow(/`props` prop value was not handled by extractStyles: `"invalid"`/);
  });

  it('handles the `component` prop correctly', () => {
    const rv = extractStyles({
      src: `<Block component="input" />;
<Block component={Thing} />;
<Block component={thing.cool} />;`,
      sourceFileName: 'test/component-prop1.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/component-prop1.jsxstyle.css");
<input className="_x0" />;
<Thing className="_x0" />;
<thing.cool className="_x0" />;`
    );

    expect(() =>
      extractStyles({
        src: '<Block component="CapitalisedString" />',
        sourceFileName: 'test/component-prop2.js',
        cacheObject: {},
        staticNamespace,
      })
    ).toThrow(/`component` prop is a string that starts with an uppercase letter \(`CapitalisedString`\)/);

    expect(() =>
      extractStyles({
        src: '<Block component={lowercaseIdentifier} />',
        sourceFileName: 'test/component-prop3.js',
        cacheObject: {},
        staticNamespace,
      })
    ).toThrow(/`component` prop is an identifier that starts with a lowercase letter \(`lowercaseIdentifier`\)/);

    expect(() =>
      extractStyles({
        src: '<Block component={functionCall()} />',
        sourceFileName: 'test/component-prop4.js',
        cacheObject: {},
        staticNamespace,
      })
    ).toThrow(/`component` prop value was not handled by extractStyles: `functionCall\(\)`/);

    expect(() =>
      extractStyles({
        src: '<Block component={member.expression()} />',
        sourceFileName: 'test/component-prop4.js',
        cacheObject: {},
        staticNamespace,
      })
    ).toThrow(/`component` prop value was not handled by extractStyles: `member.expression\(\)`/);
  });
});
