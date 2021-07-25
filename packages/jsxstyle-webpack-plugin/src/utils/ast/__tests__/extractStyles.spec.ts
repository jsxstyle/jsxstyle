import path = require('path');

import { extractStyles } from '../extractStyles';

const modulesByAbsolutePath = {
  [require.resolve('./mock/LC')]: require('./mock/LC'),
};

const pathTo = (thing: string) => path.resolve(__dirname, thing);

process.chdir(__dirname);

describe('the basics', () => {
  it('only extracts styles from valid jsxstyle components', () => {
    const rv1 = extractStyles(
      `import {Block as TestBlock, Flex, InlineRow, InlineCol} from "jsxstyle";
const {Col: TestCol, Row} = require("jsxstyle");
<Block extract="nope" />;
<TestBlock extract="yep" />;
<Row extract="yep" />;
<Col extract="nope" />;
<InlineBlock extract="nope" />;
<Flex extract="yep" />;
<InlineRow extract="yep" />;
<InlineCol extract="yep" />;
<TestCol extract="yep" />;`,
      pathTo('mock/validate.js'),
      { cacheObject: {}, modulesByAbsolutePath }
    );

    expect(rv1.js).toMatchInlineSnapshot(`
"import \\"./validate__jsxstyle.css\\";
<Block extract=\\"nope\\" />;
<div className=\\"_x0\\" />;
<div className=\\"_x1\\" />;
<Col extract=\\"nope\\" />;
<InlineBlock extract=\\"nope\\" />;
<div className=\\"_x2\\" />;
<div className=\\"_x3\\" />;
<div className=\\"_x4\\" />;
<div className=\\"_x5\\" />;"
`);
  });

  it('puts spaces between each class name', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block className="orange" color={thing1 ? "orange" : "purple"} width={thing2 ? 200 : 400} />`,
      pathTo('mock/classname-spaces.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./classname-spaces__jsxstyle.css\\";
<div className={\\"orange \\" + ((thing1 ? \\"_x1\\" : \\"_x2\\") + (\\" \\" + (thing2 ? \\"_x3\\" : \\"_x4\\"))) + \\" _x0\\"} />;"
`);
  });
});

describe('element conversion', () => {
  it('converts jsxstyle elements to plain elements when all props are static', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
import LC from "./LC";
const val = "thing";
<Block
  staticString="wow"
  staticInt={69}
  staticFloat={6.9}
  staticNegativeInt={-420}
  staticValue={val}
  staticMemberExpression={LC.staticValue}
/>`,
      pathTo('mock/extract-static1.js'),
      { cacheObject: {}, modulesByAbsolutePath }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./extract-static1__jsxstyle.css\\";
import LC from \\"./LC\\";
const val = \\"thing\\";
<div className=\\"_x0\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/extract-static1.js:4-11 (Block) */
._x0 {
  display: block;
  static-float: 6.9px;
  static-int: 69px;
  static-member-expression: ok;
  static-negative-int: -420px;
  static-string: wow;
  static-value: thing;
}
"
`);
  });

  it('converts jsxstyle elements to Block elements when some props aren\u2019t static', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
const val = "thing";
import LC from "./LC";
<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} dynamicValue={notStatic} />`,
      pathTo('mock/extract-static2.js'),
      { cacheObject: {}, modulesByAbsolutePath }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./extract-static2__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
const val = \\"thing\\";
import LC from \\"./LC\\";
<Box dynamicValue={notStatic} className=\\"_x0\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/extract-static2.js:4 (Block) */
._x0 {
  display: block;
  static-int: 69px;
  static-member-expression: ok;
  static-string: wow;
  static-value: thing;
}
"
`);
  });
});

describe('spread operators', () => {
  it("doesn't explode if you use the spread operator", () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
const BlueBlock = ({wow, ...props}) => <Block color="blue" {...props} test="wow" />;
const DynamicBlock = ({wow, ...props}) => <Block dynamicProp={wow} {...props} />;`,
      pathTo('mock/rest-spread.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./rest-spread__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";

const BlueBlock = ({
  wow,
  ...props
}) => <Box display=\\"block\\" color=\\"blue\\" {...props} test={null} className=\\"_x0\\" />;

const DynamicBlock = ({
  wow,
  ...props
}) => <Box display=\\"block\\" dynamicProp={wow} {...props} />;"
`);
  });

  it('handles props mixed with spread operators', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block doNotExtract="no" {...spread} extract="yep" />`,
      pathTo('mock/spread.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./spread__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"block\\" doNotExtract=\\"no\\" {...spread} extract={null} className=\\"_x0\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/spread.js:2 (Block) */
._x0 {
  extract: yep;
}
"
`);
  });

  it('handles reserved props before the spread operators', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block
  className={wow}
  component="wow"
  props={{test: 4}}
  key={test}
  ref={test}
  style={{}}
  {...spread}
  color="red"
/>`,
      pathTo('mock/spread.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./spread__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"block\\" component=\\"wow\\" props={{
  test: 4
}} key={test} ref={test} style={{}} {...spread} color={null} className={(spread != null && spread.className || wow || \\"\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/spread.js:2-11 (Block) */
._x0 {
  color: red;
}
"
`);
  });

  it('extracts spreads from trusted sources', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
import LC from "./LC";
const staticSpread = {
  color: "#444",
  "width": 420
};

function Thing(props) {
  return <Block width="100%" {...LC.containerStyles} {...staticSpread} />;
}
`,
      pathTo('mock/trusted-spreads.js'),
      { cacheObject: {}, modulesByAbsolutePath }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./trusted-spreads__jsxstyle.css\\";
import LC from \\"./LC\\";
const staticSpread = {
  color: \\"#444\\",
  \\"width\\": 420
};

function Thing(props) {
  return <div className=\\"_x0\\" />;
}"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/trusted-spreads.js:9 (Block) */
._x0 {
  background-color: #FFF;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07);
  color: #444;
  display: block;
  width: 420px;
}
"
`);
  });
});

describe('cache object', () => {
  it('updates `cacheObject` counter and key object', () => {
    const cacheObject = {};

    extractStyles(
      `import {Block} from "jsxstyle"; <Block />`,
      pathTo('mock/cache-object.js'),
      { cacheObject }
    );

    extractStyles(
      `import {Block} from "jsxstyle"; <Block staticThing="wow" />`,
      pathTo('mock/cache-object.js'),
      { cacheObject }
    );

    extractStyles(
      `import {InlineBlock} from "jsxstyle"; <InlineBlock />`,
      pathTo('mock/cache-object.js'),
      { cacheObject }
    );

    expect(cacheObject).toEqual({
      [Symbol.for('counter')]: 3,
      'display:block;': '_x0',
      'display:block;staticThing:wow;': '_x1',
      'display:inline-block;': '_x2',
    });
  });
});

describe('jsxstyle-specific props', () => {
  it('handles the `props` prop correctly', () => {
    const warnCallback = jest.fn();

    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block props={{staticObject: "yep"}} />;
<Block props={{}} />;
<Block props={variable} />;
<Block props={calledFunction()} />;
<Block props={member.expression} />;
<Block props={{objectShorthand}} />;
<Block props={{...one, two: {three, four: "five", ...six}}} seven="eight" />;
<Block props={{ "aria-hidden": true }} />;
<Block props={{className: "test"}} />;
<Block props={{style: "test"}} />;
<Block props="invalid" />;
<Block dynamicProp={wow} props="invalid" />;
<Block props={{ "aria hidden": true }} />;
<Block props={{ "-aria-hidden": true }} />;`,
      pathTo('mock/props-prop1.js'),
      { cacheObject: {}, warnCallback }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./props-prop1__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<div staticObject=\\"yep\\" className=\\"_x0\\" />;
<div className=\\"_x0\\" />;
<div {...variable} className=\\"_x0\\" />;
<div {...calledFunction()} className=\\"_x0\\" />;
<div {...member.expression} className=\\"_x0\\" />;
<div objectShorthand={objectShorthand} className=\\"_x0\\" />;
<div {...one} two={{
  three,
  four: \\"five\\",
  ...six
}} className=\\"_x1\\" />;
<div aria-hidden={true} className=\\"_x0\\" />;
<Box props={{
  className: \\"test\\"
}} className=\\"_x0\\" />;
<Box props={{
  style: \\"test\\"
}} className=\\"_x0\\" />;
<Box props=\\"invalid\\" className=\\"_x0\\" />;
<Box dynamicProp={wow} props=\\"invalid\\" className=\\"_x0\\" />;
<Box props={{
  \\"aria hidden\\": true
}} className=\\"_x0\\" />;
<Box props={{
  \\"-aria-hidden\\": true
}} className=\\"_x0\\" />;"
`);
    expect(warnCallback).toHaveBeenCalledTimes(6);
  });

  it('does not attempt to extract a ref prop found on a jsxstyle component', () => {
    const warnCallback = jest.fn();

    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color="red" ref={this.cannotBeExtracted} />`,
      pathTo('mock/props-prop2.js'),
      { cacheObject: {}, warnCallback }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./props-prop2__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box ref={this.cannotBeExtracted} className=\\"_x0\\" />;"
`);
    expect(warnCallback).toHaveBeenCalledWith(
      'The `ref` prop cannot be extracted from a jsxstyle component. If you want to attach a ref to the underlying component or element, specify a `ref` property in the `props` object.'
    );
  });

  it('handles the `component` prop correctly', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block component="input" />;
<Block component={Thing} />;
<Block component={thing.cool} />;
<Block component="h1" {...spread} />;
<Block before="wow" component="h1" dynamic={wow} color="red" />;`,
      pathTo('mock/component-prop1.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./component-prop1__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<input className=\\"_x0\\" />;
<Thing className=\\"_x0\\" />;
<thing.cool className=\\"_x0\\" />;
<Box display=\\"block\\" component=\\"h1\\" {...spread} />;
<Box component=\\"h1\\" dynamic={wow} className=\\"_x1\\" />;"
`);

    const warnCallback = jest.fn();

    // does not warn
    extractStyles(
      `import {Block} from "jsxstyle";
<Block component="CapitalisedString" />`,
      pathTo('mock/component-prop2.js'),
      { cacheObject: {}, warnCallback }
    );

    // does not warn
    extractStyles(
      `import {Block} from "jsxstyle";
<Block component={lowercaseIdentifier} />`,
      pathTo('mock/component-prop3.js'),
      { cacheObject: {}, warnCallback }
    );

    extractStyles(
      `import {Block} from "jsxstyle";
    <Block component={functionCall()} />`,
      pathTo('mock/component-prop4.js'),
      { cacheObject: {}, warnCallback }
    );

    extractStyles(
      `import {Block} from "jsxstyle";
    <Block component={member.expression()} />`,
      pathTo('mock/component-prop4.js'),
      { cacheObject: {}, warnCallback }
    );

    expect(warnCallback).toHaveBeenCalledTimes(4);
  });

  it('converts complex `component` prop values to varable declarations', () => {
    const warnCallback = jest.fn();

    const rv = extractStyles(
      `import { Block } from "jsxstyle";
function Test({ component, thing }) {
  const Compy = component;

  <Block component={Compy || 'h1'}>
    <Block component={complex}>
      <Block component="Complex" />
    </Block>
  </Block>;

  <Block component={complex} />;
}`,
      pathTo('mock/funky-component-prop.js'),
      { cacheObject: {}, warnCallback }
    );

    expect(warnCallback).toHaveBeenCalledTimes(4);
    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./funky-component-prop__jsxstyle.css\\";

function Test({
  component,
  thing
}) {
  const Compy = component;
  var Component = Compy || 'h1',
      Component2 = complex,
      Component3 = \\"Complex\\";
  <Component className=\\"_x0\\">
    <Component2 className=\\"_x0\\">
      <Component3 className=\\"_x0\\" />
    </Component2>
  </Component>;
  var Component4 = complex;
  <Component4 className=\\"_x0\\" />;
}"
`);
  });

  it('handles the `className` prop correctly', () => {
    const rv1 = extractStyles(
      `import {Block, Row} from "jsxstyle";
<Row className={member.expression} {...spread} />;
<Block className="orange" />;`,
      pathTo('mock/class-name1.js'),
      { cacheObject: {} }
    );

    expect(rv1.js).toMatchInlineSnapshot(`
"import \\"./class-name1__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"flex\\" flexDirection=\\"row\\" className={member.expression} {...spread} />;
<div className=\\"orange _x0\\" />;"
`);
  });

  it('handles the `mediaQueries` prop correctly', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block
  mediaQueries={{ sm: "only screen and (min-width: 640px)" }}
  width={640}
  smWidth="100%"
/>;`,
      pathTo('mock/media-queries.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./media-queries__jsxstyle.css\\";
<div className=\\"_x0\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/media-queries.js:2-6 (Block) */
._x0 {
  display: block;
  width: 640px;
}
@media only screen and (min-width: 640px) { ._x0 {
  width: 100%;
} }
"
`);
  });

  it('evaluates the `mediaQueries` prop correctly', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
import LC from "./LC";
<Block
  mediaQueries={LC.mediaQueries}
  width={640}
  smWidth="100%"
/>;`,
      pathTo('mock/media-queries.js'),
      { cacheObject: {}, modulesByAbsolutePath }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./media-queries__jsxstyle.css\\";
import LC from \\"./LC\\";
<div className=\\"_x0\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/media-queries.js:3-7 (Block) */
._x0 {
  display: block;
  width: 640px;
}
@media small media query { ._x0 {
  width: 100%;
} }
"
`);
  });
});

describe('ternaries', () => {
  it('extracts a ternary expression that has static consequent and alternate', () => {
    const rv = extractStyles(
      `import { Block } from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} />`,
      pathTo('mock/ternary.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary__jsxstyle.css\\";
<div className={(dynamic ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);
  });

  it('extracts a conditional expression with a static right side and an AND operator', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic && "red"} />`,
      pathTo('mock/ternary.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary__jsxstyle.css\\";
<div className={(dynamic ? \\"_x1\\" : \\"\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/ternary.js:2 (Block) */
._x0 {
  display: block;
}
/* ./mock/ternary.js:2 (Block) */
._x1 {
  color: red;
}
"
`);
  });

  it.skip('extracts a conditional expression with a static right side and an OR operator', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic || "red"} />`,
      pathTo('mock/ternary.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot();
    expect(rv.css).toMatchInlineSnapshot();
  });

  it('extracts a ternary expression that has a static consequent and alternate', () => {
    const rv = extractStyles(
      `import LC from "./LC";
import {Block} from "jsxstyle";
const blue = "blueberry";
<Block color={dynamic ? LC.red : blue} />`,
      pathTo('mock/ternary.js'),
      { cacheObject: {}, modulesByAbsolutePath }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary__jsxstyle.css\\";
import LC from \\"./LC\\";
const blue = \\"blueberry\\";
<div className={(dynamic ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/ternary.js:4 (Block) */
._x0 {
  display: block;
}
/* ./mock/ternary.js:4 (Block) */
._x1 {
  color: strawberry;
}
/* ./mock/ternary.js:4 (Block) */
._x2 {
  color: blueberry;
}
"
`);
  });

  it('extracts a ternary expression from a component that has a className specified', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block className="cool" color={dynamic ? "red" : "blue"} />`,
      pathTo('mock/ternary-with-classname.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-with-classname__jsxstyle.css\\";
<div className={\\"cool \\" + (dynamic ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);

    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/ternary-with-classname.js:2 (Block) */
._x0 {
  display: block;
}
/* ./mock/ternary-with-classname.js:2 (Block) */
._x1 {
  color: red;
}
/* ./mock/ternary-with-classname.js:2 (Block) */
._x2 {
  color: blue;
}
"
`);
  });

  it('extracts a ternary expression from a component that has a spread operator specified', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block {...spread} color={dynamic ? "red" : "blue"} />`,
      pathTo('mock/ternary-with-spread.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-with-spread__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"block\\" {...spread} color={null} className={dynamic ? \\"_x0\\" : \\"_x1\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/ternary-with-spread.js:2 (Block) */
._x0 {
  color: red;
}
/* ./mock/ternary-with-spread.js:2 (Block) */
._x1 {
  color: blue;
}
"
`);
  });

  it('positivizes binary expressions', () => {
    const rv1 = extractStyles(
      `import {Block} from "jsxstyle";
  <Block
    thing1={dynamic === 4 && "four"}
    thing2={dynamic !== 4 && "not four"}
    thing3={dynamic === 4 ? "four" : "not four"}
    thing4={dynamic !== 4 ? "not four" : "four"}
  />`,
      pathTo('mock/binary-expressions.js'),
      { cacheObject: {} }
    );

    const rv2 = extractStyles(
      `import {Block} from "jsxstyle";
  <Block
    thing1={dynamic == 4 && "four"}
    thing2={dynamic != 4 && "not four"}
    thing3={dynamic == 4 ? "four" : "not four"}
    thing4={dynamic != 4 ? "not four" : "four"}
  />`,
      pathTo('mock/binary-expressions.js'),
      { cacheObject: {} }
    );

    expect(rv1.js).toMatchInlineSnapshot(`
"import \\"./binary-expressions__jsxstyle.css\\";
<div className={(dynamic === 4 ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);
    expect(rv2.js).toMatchInlineSnapshot(`
"import \\"./binary-expressions__jsxstyle.css\\";
<div className={(dynamic == 4 ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);
    expect(rv1.css).toEqual(rv2.css);
    expect(rv1.css).toMatchInlineSnapshot(`
"/* ./mock/binary-expressions.js:2-7 (Block) */
._x0 {
  display: block;
}
/* ./mock/binary-expressions.js:2-7 (Block) */
._x1 {
  thing1: four;
  thing3: four;
  thing4: four;
}
/* ./mock/binary-expressions.js:2-7 (Block) */
._x2 {
  thing2: not four;
  thing3: not four;
  thing4: not four;
}
"
`);
  });

  it('positivizes unary expressions', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
    <Block
      thing1={dynamic % 2 && "mod 2"}
      thing2={!(dynamic % 2) && "not mod 2"}
      thing3={dynamic % 2 ? "mod 2" : "not mod 2"}
      thing4={!(dynamic % 2) ? "not mod 2" : "mod 2"}
    />`,
      pathTo('mock/unary-expressions.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./unary-expressions__jsxstyle.css\\";
<div className={(dynamic % 2 ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/unary-expressions.js:2-7 (Block) */
._x0 {
  display: block;
}
/* ./mock/unary-expressions.js:2-7 (Block) */
._x1 {
  thing1: mod 2;
  thing3: mod 2;
  thing4: mod 2;
}
/* ./mock/unary-expressions.js:2-7 (Block) */
._x2 {
  thing2: not mod 2;
  thing3: not mod 2;
  thing4: not mod 2;
}
"
`);
  });

  it('ignores a ternary expression that comes before a spread operator', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} {...spread} className="cool" />`,
      pathTo('mock/ternary-with-classname.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toEqual(`import { Box } from "jsxstyle";
<Box display="block" color={dynamic ? "red" : "blue"} {...spread} className="cool" />;`);
  });

  it('groups extracted ternary statements', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} width={dynamic ? 200 : 400} />`,
      pathTo('mock/ternary-groups.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-groups__jsxstyle.css\\";
<div className={(dynamic ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/ternary-groups.js:2 (Block) */
._x0 {
  display: block;
}
/* ./mock/ternary-groups.js:2 (Block) */
._x1 {
  color: red;
  width: 200px;
}
/* ./mock/ternary-groups.js:2 (Block) */
._x2 {
  color: blue;
  width: 400px;
}
"
`);
  });

  it('handles null values in ternaries correctly', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic ? null : "blue"} />`,
      pathTo('mock/ternary-null-values.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-null-values__jsxstyle.css\\";
<div className={(dynamic ? \\"\\" : \\"_x1\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/ternary-null-values.js:2 (Block) */
._x0 {
  display: block;
}
/* ./mock/ternary-null-values.js:2 (Block) */
._x1 {
  color: blue;
}
"
`);
  });
});

describe('useMatchMedia', () => {
  it('marks useMatchMedia calls as pure', () => {
    const rv1 = extractStyles(
      `import { Block, useMatchMedia } from 'jsxstyle';

export const MyComponent = () => {
  const matchesThing = useMatchMedia('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};`,
      pathTo('mock/useMatchMedia-import.js'),
      { cacheObject: {} },
      { classNameFormat: 'hash' }
    );
    expect(rv1.js).toContain('/*#__PURE__*/useMatchMedia(');

    const rv2 = extractStyles(
      `import { Block, useMatchMedia as useMM } from 'jsxstyle';

export const MyComponent = () => {
  const matchesThing = useMM('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};`,
      pathTo('mock/useMatchMedia-import-renamed.js'),
      { cacheObject: {} },
      { classNameFormat: 'hash' }
    );
    expect(rv2.js).toContain('/*#__PURE__*/useMM(');

    const rv3 = extractStyles(
      `const { Block, useMatchMedia } = require('jsxstyle');

const MyComponent = () => {
  const matchesThing = useMatchMedia('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};

module.exports = MyComponent;`,
      pathTo('mock/useMatchMedia-required.js'),
      { cacheObject: {} },
      { classNameFormat: 'hash' }
    );
    expect(rv3.js).toContain('/*#__PURE__*/useMatchMedia(');

    const rv4 = extractStyles(
      `const { Block, useMatchMedia: useMM } = require('jsxstyle');

const MyComponent = () => {
  const matchesThing = useMM('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};

module.exports = MyComponent;`,
      pathTo('mock/useMatchMedia-required-renamed.js'),
      { cacheObject: {} },
      { classNameFormat: 'hash' }
    );
    expect(rv4.js).toContain('/*#__PURE__*/useMM(');
  });

  it('removes unused hook calls that are marked as "pure"', async () => {
    const source = `
import { useMatchMedia, Block } from 'jsxstyle';
import React from 'react';

export const MyComponent = () => {
  const unusedThing1 = /* #__PURE__ */ useMatchMedia('this call gets minified out');
  const unusedThing2 = useMatchMedia('this call stays');
  const usedThing = /* #__PURE__ */ useMatchMedia('this call stays as well');

  return React.createElement(Block, { usedThing });
};
`;

    const terser = await import('terser');

    const minifyOutput = terser.minify(source, {
      compress: {
        // remove dead code
        dead_code: true,
      },
      // don't rename vars
      mangle: false,
      output: {
        // format output nicely
        beautify: true,
      },
    });

    expect(minifyOutput.code).toMatchInlineSnapshot(`
"import { useMatchMedia, Block } from \\"jsxstyle\\";

import React from \\"react\\";

export const MyComponent = () => {
    useMatchMedia(\\"this call stays\\");
    const usedThing = useMatchMedia(\\"this call stays as well\\");
    return React.createElement(Block, {
        usedThing: usedThing
    });
};"
`);
  });

  it('extracts ternaries and conditional statements', () => {
    const source = `
    import { useMatchMedia, Block } from 'jsxstyle';
    import React from 'react';

    export const MyComponent = () => {
      const matchesMQ = useMatchMedia('matchMedia media query');
      return <>
        <Block
          color={matchesMQ && 'red'}
        />
        <Block
          color={matchesMQ ? 'red' : 'blue'}
        />
      </>;
    };
    `;

    const rv = extractStyles(
      source,
      pathTo('mock/useMatchMedia-extraction.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./useMatchMedia-extraction__jsxstyle.css\\";
import { useMatchMedia } from 'jsxstyle';
import React from 'react';
export const MyComponent = () => {
  const useMatchMedia_matchesMQ = /*#__PURE__*/useMatchMedia('matchMedia media query');
  return <>
        <div className=\\"_x0\\" />
        <div className=\\"_x1\\" />
      </>;
};"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/useMatchMedia-extraction.js:8-10 (Block) */
._x0 {
  display: block;
}
@media matchMedia media query { ._x0 {
  color: red;
} }
/* ./mock/useMatchMedia-extraction.js:11-13 (Block) */
._x1 {
  color: blue;
  display: block;
}
@media matchMedia media query { ._x1 {
  color: red;
} }
"
`);
  });

  it('logs a warning when a `mediaQueries` prop is encountered', () => {
    const source = `
    import { useMatchMedia, Block } from 'jsxstyle';
    import React from 'react';

    export const MyComponent = () => {
      const matchesMQ = useMatchMedia('matchMedia media query');
      return <>
        <Block
          shouldRemainInline={matchesMQ ? 'consequent' : 'alternate'}
          exampleColor="red"
          mediaQueries={{ example: 'inline media query' }}
        />
        <Block
          mediaQueries={{ example: 'inline media query' }}
          exampleColor="red"
          color="blue"
          shouldRemainInline={matchesMQ ? 'consequent' : 'alternate'}
        />
      </>;
    };
    `;

    const warnCallback = jest.fn();

    const rv = extractStyles(
      source,
      pathTo('mock/mediaqueries-plus-useMatchMedia.js'),
      { cacheObject: {}, warnCallback }
    );

    expect(warnCallback).toHaveBeenCalledTimes(2);
    expect(warnCallback).toHaveBeenLastCalledWith(
      'useMatchMedia and the mediaQueries prop should not be mixed. useMatchMedia query extraction will be disabled.'
    );
    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./mediaqueries-plus-useMatchMedia__jsxstyle.css\\";
import { useMatchMedia } from 'jsxstyle';
import React from 'react';
export const MyComponent = () => {
  const useMatchMedia_matchesMQ = /*#__PURE__*/useMatchMedia('matchMedia media query');
  return <>
        <div className={(useMatchMedia_matchesMQ ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />
        <div className={(useMatchMedia_matchesMQ ? \\"_x1\\" : \\"_x2\\") + \\" _x3\\"} />
      </>;
};"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/mediaqueries-plus-useMatchMedia.js:8-12 (Block) */
._x0 {
  display: block;
}
@media inline media query { ._x0 {
  color: red;
} }
/* ./mock/mediaqueries-plus-useMatchMedia.js:8-12 (Block) */
/* ./mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
._x1 {
  should-remain-inline: consequent;
}
/* ./mock/mediaqueries-plus-useMatchMedia.js:8-12 (Block) */
/* ./mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
._x2 {
  should-remain-inline: alternate;
}
/* ./mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
._x3 {
  color: blue;
  display: block;
}
@media inline media query { ._x3 {
  color: red;
} }
"
`);
  });
});

describe('deterministic rendering', () => {
  it('generates deterministic class names when classNameFormat is set to `hash`', () => {
    const rv = extractStyles(
      `import { Block } from "jsxstyle";
<Block ternary={condition ? 123 : 456} />`,
      pathTo('mock/deteministic-classes.js'),
      { cacheObject: {} },
      { classNameFormat: 'hash' }
    );
    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./deteministic-classes__jsxstyle.css\\";
<div className={(condition ? \\"_nevmzf\\" : \\"_1ctok8s\\") + \\" _sfd7x3\\"} />;"
`);
  });

  it('generates a classname hash of `_d3bqdr` for the specified style object', () => {
    const rv = extractStyles(
      `import { Block } from "jsxstyle";
<Block
  color="red"
  hoverColor="green"
  testActiveColor="blue"
  mediaQueries={{
    'test': 'example media query',
  }}
/>`,
      pathTo('mock/consistent-hashes.js'),
      { cacheObject: {} },
      { classNameFormat: 'hash' }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./consistent-hashes__jsxstyle.css\\";
<div className=\\"_d3bqdr\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/consistent-hashes.js:2-9 (Block) */
._d3bqdr {
  color: red;
  display: block;
}
._d3bqdr:hover {
  color: green;
}
@media example media query { ._d3bqdr:active {
  color: blue;
} }
"
`);
  });
});

describe('animation prop', () => {
  it('properly extracts object-type animation props', () => {
    const rv = extractStyles(
      `import { Block } from "jsxstyle";
<Block
  animation={{
    '0%, 50%': { opacity: 0, paddingLeft: 30 },
    '100%': { opacity: 1, paddingH: 50 },
  }}
/>`,
      pathTo('mock/animation-prop.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./animation-prop__jsxstyle.css\\";
<div className=\\"_x0\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* ./mock/animation-prop.js:2-7 (Block) */
._x0 {
  animation-name: jsxstyle_nqjahi;
  display: block;
}
@keyframes jsxstyle_nqjahi {
0%, 50% {
  opacity: 0;
  padding-left: 30px;
}
100% {
  opacity: 1;
  padding-h: 50px;
}
}
"
`);
  });
});

describe('Typescript support', () => {
  it('enables the `typescript` parser plugin for ts/tsx files', () => {
    const src = `import * as React from 'react';
import { Block } from 'jsxstyle';
export interface ThingProps {
  thing1: string;
  thing2?: boolean;
}
export const Thing: React.FC<ThingProps> = props => <Block />;
ReactDOM.render(<Thing />, (document.getElementById('root') as HTMLElement));`;

    const tsResults = extractStyles(src, pathTo('mock/typescript.ts'), {
      cacheObject: {},
    });

    const tsxResults = extractStyles(src, pathTo('mock/typescript.tsx'), {
      cacheObject: {},
    });

    expect(tsResults.js).toEqual(tsxResults.js);
    expect(tsResults.js).toMatchInlineSnapshot(`
"import \\"./typescript__jsxstyle.css\\";
import * as React from 'react';
export interface ThingProps {
  thing1: string;
  thing2?: boolean;
}
export const Thing: React.FC<ThingProps> = props => <div className=\\"_x0\\" />;
ReactDOM.render(<Thing />, (document.getElementById('root') as HTMLElement));"
`);
    expect(tsxResults.js).toMatchInlineSnapshot(`
"import \\"./typescript__jsxstyle.css\\";
import * as React from 'react';
export interface ThingProps {
  thing1: string;
  thing2?: boolean;
}
export const Thing: React.FC<ThingProps> = props => <div className=\\"_x0\\" />;
ReactDOM.render(<Thing />, (document.getElementById('root') as HTMLElement));"
`);
  });
});

describe('evaluateVars config option', () => {
  it('does not evaluate vars if evaluateVars is set to false', () => {
    const js = `import { Block } from 'jsxstyle';
const staticProp = 'static';
<Block thing1={staticProp} thing2={69} />`;

    const evalVars = extractStyles(
      js,
      pathTo('mock/evaluateVars.js'),
      { cacheObject: {} },
      { evaluateVars: true }
    );

    const noEvalVars = extractStyles(
      js,
      pathTo('mock/evaluateVars.js'),
      { cacheObject: {} },
      { evaluateVars: false }
    );

    expect(evalVars.js).not.toEqual(noEvalVars.js);
    expect(evalVars.js).toMatchInlineSnapshot(`
"import \\"./evaluateVars__jsxstyle.css\\";
const staticProp = 'static';
<div className=\\"_x0\\" />;"
`);
    expect(noEvalVars.js).toMatchInlineSnapshot(`
"import \\"./evaluateVars__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
const staticProp = 'static';
<Box thing1={staticProp} className=\\"_x0\\" />;"
`);
  });
});

describe('edge cases', () => {
  it('only removes component imports', () => {
    const rv = extractStyles(
      `import 'jsxstyle';
import { cache, InvalidComponent, Row as RenamedRow } from 'jsxstyle';
import { Grid } from 'jsxstyle';
// should probably remove this as well
require('jsxstyle');
const { Box } = require('jsxstyle');
const { Block, Col: RenamedCol } = require('jsxstyle');
const { invalid, AlsoInvalid, InlineBlock } = require('jsxstyle');`,
      pathTo('mock/edge-case1.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import { cache, InvalidComponent } from 'jsxstyle';

// should probably remove this as well
require('jsxstyle');

const {
  invalid,
  AlsoInvalid
} = require('jsxstyle');"
`);
  });

  it('handles consts with no inits', () => {
    const fileContent = `
import { Block } from 'jsxstyle';
for (const thing in things) {
  <Block />;
}
`;
    const rv = extractStyles(fileContent, pathTo('mock/const-sans-init.js'), {
      cacheObject: {},
    });

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./const-sans-init__jsxstyle.css\\";

for (const thing in things) {
  <div className=\\"_x0\\" />;
}"
`);
  });
});
