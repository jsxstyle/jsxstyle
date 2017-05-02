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

  it('skips JSXElements that do not have a JSXIdentifier as an opening element', () => {
    const rv = extractStyles({
      src: '<member.expression color="red" />; <Member.Expression color="blue" />;',
      sourceFileName: 'test/jsxidentifier.js',
      cacheObject: {},
    });
    expect(rv.js).toEqual('<member.expression color="red" />; <Member.Expression color="blue" />;');
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
      src: `<Block doNotExtract="no" {...spread} extract="yep" />`,
      sourceFileName: 'test/spread.js',
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require("test/spread.jsxstyle.css");
<Block doNotExtract="no" {...spread} extract={null} className="_x0" />`
    );
    expect(rv.css).toEqual(
      `/* test/spread.js:1 (Block) */
._x0 {
  extract:yep;
}
`
    );
  });

  it('handles reserved props before the spread operators', () => {
    const rv = extractStyles({
      src: `<Block
  className={wow}
  component="wow"
  props={{test: 4}}
  key={test}
  ref={test}
  style={{}}
  {...spread}
  color="red"
/>`,
      sourceFileName: 'test/spread.js',
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require("test/spread.jsxstyle.css");
<Block
  component="wow"
  props={{test: 4}}
  key={test}
  ref={test}
  style={{}}
  {...spread}
  color={null}
  className={(typeof spread === "object" && spread !== null && spread.className || wow) + " " + "_x0"} />`
    );
    expect(rv.css).toEqual(
      `/* test/spread.js:1-10 (Block) */
._x0 {
  color:red;
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
      '_x~counter': 3,
      keys: {
        '_x~display:block;': '0',
        '_x~display:block;staticThing:wow;': '1',
        '_x~display:inline-block;': '2',
      },
    });
  });

  it('groups styles when a `namedStyleGroups` object is provided', () => {
    const cacheObject = {};
    const namedStyleGroups = {
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
      sourceFileName: 'test/named-style-groups.js',
      cacheObject,
      namedStyleGroups,
    });

    expect(rv.js).toEqual(
      `require("test/named-style-groups.jsxstyle.css");
<div className="_x0">
  <div className="_test1 _x0" />
  <div className="_test2" />
</div>`
    );

    expect(rv.css).toEqual(
      `/* test/named-style-groups.js:1 (Block) */
/* test/named-style-groups.js:2 (Block) */
._x0 {
  display:block;
}
/* test/named-style-groups.js:2 (Block) */
._test1 {
  thing:wow;
}
._test1:hover {
  thing:ok;
}
/* test/named-style-groups.js:3 (InlineBlock) */
._test2 {
  display:inline-block;
}
`
    );
  });

  it('groups styles when a `styleGroups` array is provided', () => {
    const cacheObject = {};
    const styleGroups = [
      {
        thing: 'wow',
        hoverThing: 'ok',
      },
      {
        display: 'inline-block',
      },
    ];

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
  <div className="_x1 _x0" />
  <div className="_x2" />
</div>`
    );

    expect(rv.css).toEqual(
      `/* test/style-groups.js:1 (Block) */
/* test/style-groups.js:2 (Block) */
._x0 {
  display:block;
}
/* test/style-groups.js:2 (Block) */
._x1 {
  thing:wow;
}
._x1:hover {
  thing:ok;
}
/* test/style-groups.js:3 (InlineBlock) */
._x2 {
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
<Block props={{objectShorthand}} />;
<Block props={{...one, two: {three, four: 'five', ...six}}} seven="eight" />;`,
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
<div objectShorthand={objectShorthand} className="_x0" />;
<div {...one} two={{three, four: 'five', ...six}} className="_x1" />;`
    );

    const rv2 = extractStyles({
      src: `<Block color="red" ref={r => this.testBlock = r} />`,
      sourceFileName: 'test/props-prop2.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv2.js).toEqual(
      `require("test/props-prop2.jsxstyle.css");
<div ref={r => this.testBlock = r} className="_x0" />`
    );

    global.console = {warn: jest.fn()};
    const rv3 = extractStyles({
      src: `<Block props={{className: 'test'}} />;
<Block props={{style: 'test'}} />;
<Block props="invalid" />;
<Block dynamicProp={wow} props="invalid" />;`,
      sourceFileName: 'test/props-prop4.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv3.js).toEqual(
      `<Block props={{className: 'test'}} />;
<Block props={{style: 'test'}} />;
<Block props="invalid" />;
<Block dynamicProp={wow} props="invalid" />;`
    );

    expect(console.warn).toHaveBeenCalledTimes(4);
  });

  it("doesn't explode if you use the spread operator", () => {
    const rv = extractStyles({
      src: `const BlueBlock = ({wow, ...props}) => <Block color="blue" {...props} test="wow" />;
const DynamicBlock = ({wow, ...props}) => <Block dynamicProp={wow} {...props} />;`,
      sourceFileName: 'test/rest-spread.js',
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require("test/rest-spread.jsxstyle.css");
const BlueBlock = ({wow, ...props}) => <Block color="blue" {...props} test={null} className="_x0" />;
const DynamicBlock = ({wow, ...props}) => <Block dynamicProp={wow} {...props} />;`
    );
  });

  it('extracts a ternary expression that has static consequent and alternate', () => {
    const rv = extractStyles({
      src: `<Block color={dynamic ? 'red' : 'blue'} />`,
      sourceFileName: 'test/ternary.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/ternary.jsxstyle.css");
<div className={((dynamic ? "_x1" : "_x2")) + " " + "_x0"} />`
    );
  });

  it('extracts a ternary expression from a component that has a className specified', () => {
    const rv = extractStyles({
      src: `<Block className="cool" color={dynamic ? 'red' : 'blue'} />`,
      sourceFileName: 'test/ternary-with-classname.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/ternary-with-classname.jsxstyle.css");
<div className={"cool " + ((dynamic ? "_x1" : "_x2")) + " " + "_x0"} />`
    );
  });

  it('ignores a ternary expression that comes before a spread operator', () => {
    const rv = extractStyles({
      src: `<Block color={dynamic ? 'red' : 'blue'} {...spread} className="cool" />`,
      sourceFileName: 'test/ternary-with-classname.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(`<Block color={dynamic ? 'red' : 'blue'} {...spread} className="cool" />`);
  });

  it('extracts a ternary expression from a component that has a className and spread operator', () => {
    const rv = extractStyles({
      src: `<Block {...spread} color={dynamic ? 'red' : 'blue'} />`,
      sourceFileName: 'test/ternary-with-spread.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.css).toEqual(
      `/* test/ternary-with-spread.js:1 (Block) */
._x0 {
  color:red;
}
/* test/ternary-with-spread.js:1 (Block) */
._x1 {
  color:blue;
}
`
    );

    expect(rv.js).toEqual(
      `require("test/ternary-with-spread.jsxstyle.css");
<Block {...spread} color={null} className={(dynamic ? "_x0" : "_x1")} />`
    );
  });

  it('groups extracted ternary statements', () => {
    const rv = extractStyles({
      src: `<Block color={dynamic ? 'red' : 'blue'} width={dynamic ? 200 : 400} />`,
      sourceFileName: 'test/ternary-groups.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/ternary-groups.jsxstyle.css");
<div className={((dynamic ? "_x1" : "_x2")) + " " + "_x0"} />`
    );

    expect(rv.css).toEqual(
      `/* test/ternary-groups.js:1 (Block) */
._x0 {
  display:block;
}
/* test/ternary-groups.js:1 (Block) */
._x1 {
  color:red;
  width:200px;
}
/* test/ternary-groups.js:1 (Block) */
._x2 {
  color:blue;
  width:400px;
}
`
    );
  });

  it('handles null values in ternaries correctly', () => {
    const rv = extractStyles({
      src: `<Block color={dynamic ? null : 'blue'} />`,
      sourceFileName: 'test/ternary-null-values.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/ternary-null-values.jsxstyle.css");
<div className={((dynamic ? "" : "_x1")) + " " + "_x0"} />`
    );

    expect(rv.css).toEqual(
      `/* test/ternary-null-values.js:1 (Block) */
._x0 {
  display:block;
}
/* test/ternary-null-values.js:1 (Block) */
._x1 {
  color:blue;
}
`
    );
  });

  it('handles the `component` prop correctly', () => {
    const rv = extractStyles({
      src: `<Block component="input" />;
<Block component={Thing} />;
<Block component={thing.cool} />;
<Block component="h1" {...spread} />;
<Block before="wow" component="h1" dynamic={wow} color="red" />;`,
      sourceFileName: 'test/component-prop1.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv.js).toEqual(
      `require("test/component-prop1.jsxstyle.css");
<input className="_x0" />;
<Thing className="_x0" />;
<thing.cool className="_x0" />;
<Block component="h1" {...spread} />;
<Block component="h1" dynamic={wow} className="_x1" />;`
    );

    global.console = {warn: jest.fn()};

    // does not warn
    extractStyles({
      src: '<Block component="CapitalisedString" />',
      sourceFileName: 'test/component-prop2.js',
      cacheObject: {},
      staticNamespace,
    });

    // does not warn
    extractStyles({
      src: '<Block component={lowercaseIdentifier} />',
      sourceFileName: 'test/component-prop3.js',
      cacheObject: {},
      staticNamespace,
    });

    extractStyles({
      src: '<Block component={functionCall()} />',
      sourceFileName: 'test/component-prop4.js',
      cacheObject: {},
      staticNamespace,
    });

    extractStyles({
      src: '<Block component={member.expression()} />',
      sourceFileName: 'test/component-prop4.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('handles the `className` prop correctly', () => {
    const rv1 = extractStyles({
      src: `<Row
  className={member.expression}
  {...spread}
/>`,
      sourceFileName: 'test/class-name1.js',
      cacheObject: {},
      staticNamespace,
    });

    expect(rv1.js).toEqual(
      `<Row
  className={member.expression}
  {...spread}
/>`
    );
  });
});
