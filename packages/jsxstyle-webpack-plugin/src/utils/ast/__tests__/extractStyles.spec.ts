import { createClassNameGetter } from 'jsxstyle-utils';
import path = require('path');
import {
  extractStyles,
  ExtractStylesOptions,
  UserConfigurableOptions,
} from '../extractStyles';

const modulesByAbsolutePath = {
  [require.resolve('./mock/LC')]: require('./mock/LC'),
};

process.chdir(__dirname);

const runExtractStyles = (
  src: string,
  sourceFileName: string,
  options: Partial<ExtractStylesOptions> = {},
  esOptions: UserConfigurableOptions = {}
) => {
  const getClassNameForKey = createClassNameGetter({});
  const allOptions: ExtractStylesOptions = {
    modulesByAbsolutePath,
    getClassNameForKey,
    ...options,
  };

  return extractStyles(
    src,
    path.resolve(__dirname, sourceFileName),
    allOptions,
    esOptions
  );
};

describe('the basics', () => {
  it('only extracts styles from valid jsxstyle components', () => {
    const rv1 = runExtractStyles(
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
      'mock/validate.js'
    );

    expect(rv1.js).toMatchInlineSnapshot(`
"import \\"./validate__jsxstyle.css\\";
<Block extract=\\"nope\\" />;
<div className=\\"_x0 _x1\\" />;
<div className=\\"_x2 _x3 _x1\\" />;
<Col extract=\\"nope\\" />;
<InlineBlock extract=\\"nope\\" />;
<div className=\\"_x2 _x1\\" />;
<div className=\\"_x4 _x3 _x1\\" />;
<div className=\\"_x4 _x5 _x1\\" />;
<div className=\\"_x2 _x5 _x1\\" />;"
`);

    expect(rv1.css).toMatchInlineSnapshot(`
"/* mock/validate.js:4 (TestBlock) */
._x0 { display:block }

/* mock/validate.js:10 (InlineCol) */
/* mock/validate.js:11 (TestCol) */
/* mock/validate.js:4 (TestBlock) */
/* mock/validate.js:5 (Row) */
/* mock/validate.js:8 (Flex) */
/* mock/validate.js:9 (InlineRow) */
._x1 { extract:yep }

/* mock/validate.js:11 (TestCol) */
/* mock/validate.js:5 (Row) */
/* mock/validate.js:8 (Flex) */
._x2 { display:flex }

/* mock/validate.js:5 (Row) */
/* mock/validate.js:9 (InlineRow) */
._x3._x3 { flex-direction:row }

/* mock/validate.js:10 (InlineCol) */
/* mock/validate.js:9 (InlineRow) */
._x4 { display:inline-flex }

/* mock/validate.js:10 (InlineCol) */
/* mock/validate.js:11 (TestCol) */
._x5._x5 { flex-direction:column }
"
`);
  });

  it('puts spaces between each class name', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block className="orange" color={thing1 ? "orange" : "purple"} width={thing2 ? 200 : 400} />`,
      'mock/classname-spaces.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./classname-spaces__jsxstyle.css\\";
<div className={\\"orange \\" + ((thing1 ? \\"_x1\\" : \\"_x2\\") + (\\" \\" + (thing2 ? \\"_x3\\" : \\"_x4\\"))) + \\" _x0\\"} />;"
`);
  });
});

describe('element conversion', () => {
  it('converts jsxstyle elements to plain elements when all props are static', () => {
    const rv = runExtractStyles(
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
      'mock/extract-static1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./extract-static1__jsxstyle.css\\";
import LC from \\"./LC\\";
const val = \\"thing\\";
<div className=\\"_x0 _x1 _x2 _x3 _x4 _x5 _x6\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/extract-static1.js:4-11 (Block) */
._x0 { display:block }

/* mock/extract-static1.js:4-11 (Block) */
._x1 { static-string:wow }

/* mock/extract-static1.js:4-11 (Block) */
._x2 { static-int:69px }

/* mock/extract-static1.js:4-11 (Block) */
._x3 { static-float:6.9px }

/* mock/extract-static1.js:4-11 (Block) */
._x4 { static-negative-int:-420px }

/* mock/extract-static1.js:4-11 (Block) */
._x5 { static-value:thing }

/* mock/extract-static1.js:4-11 (Block) */
._x6 { static-member-expression:ok }
"
`);
  });

  it('converts jsxstyle elements to Block elements when some props aren\u2019t static', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
const val = "thing";
import LC from "./LC";
<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} dynamicValue={notStatic} />`,
      'mock/extract-static2.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./extract-static2__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
const val = \\"thing\\";
import LC from \\"./LC\\";
<Box dynamicValue={notStatic} className=\\"_x0 _x1 _x2 _x3 _x4\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/extract-static2.js:4 (Block) */
._x0 { display:block }

/* mock/extract-static2.js:4 (Block) */
._x1 { static-string:wow }

/* mock/extract-static2.js:4 (Block) */
._x2 { static-int:69px }

/* mock/extract-static2.js:4 (Block) */
._x3 { static-value:thing }

/* mock/extract-static2.js:4 (Block) */
._x4 { static-member-expression:ok }
"
`);
  });
});

describe('spread operators', () => {
  it("doesn't explode if you use the spread operator", () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
const BlueBlock = ({wow, ...props}) => <Block color="blue" {...props} test="wow" />;
const DynamicBlock = ({wow, ...props}) => <Block dynamicProp={wow} {...props} />;`,
      'mock/rest-spread.js'
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
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block doNotExtract="no" {...spread} extract="yep" />`,
      'mock/spread.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./spread__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"block\\" doNotExtract=\\"no\\" {...spread} extract={null} className=\\"_x0\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/spread.js:2 (Block) */
._x0 { extract:yep }
"
`);
  });

  it('handles reserved props before the spread operators', () => {
    const rv = runExtractStyles(
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
      'mock/spread.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./spread__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"block\\" component=\\"wow\\" props={{
  test: 4
}} key={test} ref={test} style={{}} {...spread} color={null} className={(spread != null && spread.className || wow || \\"\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/spread.js:2-11 (Block) */
._x0 { color:red }
"
`);
  });

  it('extracts spreads from trusted sources', () => {
    const rv = runExtractStyles(
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
      'mock/trusted-spreads.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./trusted-spreads__jsxstyle.css\\";
import LC from \\"./LC\\";
const staticSpread = {
  color: \\"#444\\",
  \\"width\\": 420
};

function Thing(props) {
  return <div className=\\"_x0 _x1 _x2 _x3 _x4 _x5\\" />;
}"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/trusted-spreads.js:9 (Block) */
._x0 { display:block }

/* mock/trusted-spreads.js:9 (Block) */
._x1 { width:420px }

/* mock/trusted-spreads.js:9 (Block) */
._x2 { border-radius:4px }

/* mock/trusted-spreads.js:9 (Block) */
._x3 { box-shadow:0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07) }

/* mock/trusted-spreads.js:9 (Block) */
._x4._x4 { background-color:#FFF }

/* mock/trusted-spreads.js:9 (Block) */
._x5 { color:#444 }
"
`);
  });
});

describe('jsxstyle-specific props', () => {
  it('handles the `props` prop correctly', () => {
    const warnCallback = jest.fn();

    const rv = runExtractStyles(
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
      'mock/props-prop1.js',
      { warnCallback }
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
}} className=\\"_x0 _x1\\" />;
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

    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block color="red" ref={this.cannotBeExtracted} />`,
      'mock/props-prop2.js',
      { warnCallback }
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./props-prop2__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box ref={this.cannotBeExtracted} className=\\"_x0 _x1\\" />;"
`);
    expect(warnCallback).toHaveBeenCalledWith(
      'The `ref` prop cannot be extracted from a jsxstyle component. If you want to attach a ref to the underlying component or element, specify a `ref` property in the `props` object.'
    );
  });

  it('handles the `component` prop correctly', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block component="input" />;
<Block component={Thing} />;
<Block component={thing.cool} />;
<Block component="h1" {...spread} />;
<Block before="wow" component="h1" dynamic={wow} color="red" />;`,
      'mock/component-prop1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./component-prop1__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<input className=\\"_x0\\" />;
<Thing className=\\"_x0\\" />;
<thing.cool className=\\"_x0\\" />;
<Box display=\\"block\\" component=\\"h1\\" {...spread} />;
<Box component=\\"h1\\" dynamic={wow} className=\\"_x0 _x1 _x2\\" />;"
`);

    const warnCallback = jest.fn();

    // does not warn
    runExtractStyles(
      `import {Block} from "jsxstyle";
<Block component="CapitalisedString" />`,
      'mock/component-prop2.js',
      { warnCallback }
    );

    // does not warn
    runExtractStyles(
      `import {Block} from "jsxstyle";
<Block component={lowercaseIdentifier} />`,
      'mock/component-prop3.js',
      { warnCallback }
    );

    runExtractStyles(
      `import {Block} from "jsxstyle";
    <Block component={functionCall()} />`,
      'mock/component-prop4.js',
      { warnCallback }
    );

    runExtractStyles(
      `import {Block} from "jsxstyle";
    <Block component={member.expression()} />`,
      'mock/component-prop4.js',
      { warnCallback }
    );

    expect(warnCallback).toHaveBeenCalledTimes(4);
  });

  it('converts complex `component` prop values to varable declarations', () => {
    const warnCallback = jest.fn();

    const rv = runExtractStyles(
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
      'mock/funky-component-prop.js',
      { warnCallback }
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
    const rv1 = runExtractStyles(
      `import {Block, Row} from "jsxstyle";
<Row className={member.expression} {...spread} />;
<Block className="orange" />;`,
      'mock/class-name1.js'
    );

    expect(rv1.js).toMatchInlineSnapshot(`
"import \\"./class-name1__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"flex\\" flexDirection=\\"row\\" className={member.expression} {...spread} />;
<div className=\\"orange _x0\\" />;"
`);
  });

  it('handles the `mediaQueries` prop correctly', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block
  mediaQueries={{ sm: "only screen and (min-width: 640px)" }}
  width={640}
  smWidth="100%"
/>;`,
      'mock/media-queries.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./media-queries__jsxstyle.css\\";
<div className=\\"_x0 _x1 _x2\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/media-queries.js:2-6 (Block) */
._x0 { display:block }

/* mock/media-queries.js:2-6 (Block) */
._x1 { width:640px }

/* mock/media-queries.js:2-6 (Block) */
._x2 { sm-width:100% }
"
`);
  });

  it('evaluates the `mediaQueries` prop correctly', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
import LC from "./LC";
<Block
  mediaQueries={LC.mediaQueries}
  width={640}
  smWidth="100%"
/>;`,
      'mock/media-queries.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./media-queries__jsxstyle.css\\";
import LC from \\"./LC\\";
<div className=\\"_x0 _x1 _x2\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/media-queries.js:3-7 (Block) */
._x0 { display:block }

/* mock/media-queries.js:3-7 (Block) */
._x1 { width:640px }

/* mock/media-queries.js:3-7 (Block) */
._x2 { sm-width:100% }
"
`);
  });
});

describe('ternaries', () => {
  it('extracts a ternary expression that has static consequent and alternate', () => {
    const rv = runExtractStyles(
      `import { Block } from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary__jsxstyle.css\\";
<div className={(dynamic ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);

    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/ternary.js:2 (Block) */
._x0 { display:block }

/* mock/ternary.js:2 (Block) */
._x1 { color:red }

/* mock/ternary.js:2 (Block) */
._x2 { color:blue }
"
`);
  });

  it('extracts a conditional expression with a static right side and an AND operator', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic && "red"} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary__jsxstyle.css\\";
<div className={(dynamic ? \\"_x1\\" : \\"\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/ternary.js:2 (Block) */
._x0 { display:block }

/* mock/ternary.js:2 (Block) */
._x1 { color:red }
"
`);
  });

  it.skip('extracts a conditional expression with a static right side and an OR operator', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic || "red"} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot();
    expect(rv.css).toMatchInlineSnapshot();
  });

  it('extracts a ternary expression that has a static consequent and alternate', () => {
    const rv = runExtractStyles(
      `import LC from "./LC";
import {Block} from "jsxstyle";
const blue = "blueberry";
<Block color={dynamic ? LC.red : blue} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary__jsxstyle.css\\";
import LC from \\"./LC\\";
const blue = \\"blueberry\\";
<div className={(dynamic ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/ternary.js:4 (Block) */
._x0 { display:block }

/* mock/ternary.js:4 (Block) */
._x1 { color:strawberry }

/* mock/ternary.js:4 (Block) */
._x2 { color:blueberry }
"
`);
  });

  it('extracts a ternary expression from a component that has a className specified', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block className="cool" color={dynamic ? "red" : "blue"} />`,
      'mock/ternary-with-classname.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-with-classname__jsxstyle.css\\";
<div className={\\"cool \\" + (dynamic ? \\"_x1\\" : \\"_x2\\") + \\" _x0\\"} />;"
`);

    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/ternary-with-classname.js:2 (Block) */
._x0 { display:block }

/* mock/ternary-with-classname.js:2 (Block) */
._x1 { color:red }

/* mock/ternary-with-classname.js:2 (Block) */
._x2 { color:blue }
"
`);
  });

  it('extracts a ternary expression from a component that has a spread operator specified', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block {...spread} color={dynamic ? "red" : "blue"} />`,
      'mock/ternary-with-spread.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-with-spread__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
<Box display=\\"block\\" {...spread} color={null} className={dynamic ? \\"_x0\\" : \\"_x1\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/ternary-with-spread.js:2 (Block) */
._x0 { color:red }

/* mock/ternary-with-spread.js:2 (Block) */
._x1 { color:blue }
"
`);
  });

  it('positivizes binary expressions', () => {
    const rv1 = runExtractStyles(
      `import {Block} from "jsxstyle";
  <Block
    thing1={dynamic === 4 && "four"}
    thing2={dynamic !== 4 && "not four"}
    thing3={dynamic === 4 ? "four" : "not four"}
    thing4={dynamic !== 4 ? "not four" : "four"}
  />`,
      'mock/binary-expressions.js'
    );

    const rv2 = runExtractStyles(
      `import {Block} from "jsxstyle";
  <Block
    thing1={dynamic == 4 && "four"}
    thing2={dynamic != 4 && "not four"}
    thing3={dynamic == 4 ? "four" : "not four"}
    thing4={dynamic != 4 ? "not four" : "four"}
  />`,
      'mock/binary-expressions.js'
    );

    expect(rv1.js).toMatchInlineSnapshot(`
"import \\"./binary-expressions__jsxstyle.css\\";
<div className={(dynamic === 4 ? \\"_x1 _x2 _x3\\" : \\"_x4 _x5 _x6\\") + \\" _x0\\"} />;"
`);
    expect(rv2.js).toMatchInlineSnapshot(`
"import \\"./binary-expressions__jsxstyle.css\\";
<div className={(dynamic == 4 ? \\"_x1 _x2 _x3\\" : \\"_x4 _x5 _x6\\") + \\" _x0\\"} />;"
`);
    expect(rv1.css).toEqual(rv2.css);
    expect(rv1.css).toMatchInlineSnapshot(`
"/* mock/binary-expressions.js:2-7 (Block) */
._x0 { display:block }

/* mock/binary-expressions.js:2-7 (Block) */
._x1 { thing1:four }

/* mock/binary-expressions.js:2-7 (Block) */
._x2 { thing3:four }

/* mock/binary-expressions.js:2-7 (Block) */
._x3 { thing4:four }

/* mock/binary-expressions.js:2-7 (Block) */
._x4 { thing2:not four }

/* mock/binary-expressions.js:2-7 (Block) */
._x5 { thing3:not four }

/* mock/binary-expressions.js:2-7 (Block) */
._x6 { thing4:not four }
"
`);
  });

  it('positivizes unary expressions', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
    <Block
      thing1={dynamic % 2 && "mod 2"}
      thing2={!(dynamic % 2) && "not mod 2"}
      thing3={dynamic % 2 ? "mod 2" : "not mod 2"}
      thing4={!(dynamic % 2) ? "not mod 2" : "mod 2"}
    />`,
      'mock/unary-expressions.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./unary-expressions__jsxstyle.css\\";
<div className={(dynamic % 2 ? \\"_x1 _x2 _x3\\" : \\"_x4 _x5 _x6\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/unary-expressions.js:2-7 (Block) */
._x0 { display:block }

/* mock/unary-expressions.js:2-7 (Block) */
._x1 { thing1:mod 2 }

/* mock/unary-expressions.js:2-7 (Block) */
._x2 { thing3:mod 2 }

/* mock/unary-expressions.js:2-7 (Block) */
._x3 { thing4:mod 2 }

/* mock/unary-expressions.js:2-7 (Block) */
._x4 { thing2:not mod 2 }

/* mock/unary-expressions.js:2-7 (Block) */
._x5 { thing3:not mod 2 }

/* mock/unary-expressions.js:2-7 (Block) */
._x6 { thing4:not mod 2 }
"
`);
  });

  it('ignores a ternary expression that comes before a spread operator', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} {...spread} className="cool" />`,
      'mock/ternary-with-classname.js'
    );

    expect(rv.js).toEqual(`import { Box } from "jsxstyle";
<Box display="block" color={dynamic ? "red" : "blue"} {...spread} className="cool" />;`);
  });

  it('groups extracted ternary statements', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} width={dynamic ? 200 : 400} />`,
      'mock/ternary-groups.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-groups__jsxstyle.css\\";
<div className={(dynamic ? \\"_x1 _x2\\" : \\"_x3 _x4\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/ternary-groups.js:2 (Block) */
._x0 { display:block }

/* mock/ternary-groups.js:2 (Block) */
._x1 { color:red }

/* mock/ternary-groups.js:2 (Block) */
._x2 { width:200px }

/* mock/ternary-groups.js:2 (Block) */
._x3 { color:blue }

/* mock/ternary-groups.js:2 (Block) */
._x4 { width:400px }
"
`);
  });

  it('handles null values in ternaries correctly', () => {
    const rv = runExtractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic ? null : "blue"} />`,
      'mock/ternary-null-values.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./ternary-null-values__jsxstyle.css\\";
<div className={(dynamic ? \\"\\" : \\"_x1\\") + \\" _x0\\"} />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/ternary-null-values.js:2 (Block) */
._x0 { display:block }

/* mock/ternary-null-values.js:2 (Block) */
._x1 { color:blue }
"
`);
  });
});

describe('useMatchMedia', () => {
  it('marks useMatchMedia calls as pure', () => {
    const rv1 = runExtractStyles(
      `import { Block, useMatchMedia } from 'jsxstyle';

export const MyComponent = () => {
  const matchesThing = useMatchMedia('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};`,
      'mock/useMatchMedia-import.js'
    );
    expect(rv1.js).toContain('/*#__PURE__*/useMatchMedia(');

    const rv2 = runExtractStyles(
      `import { Block, useMatchMedia as useMM } from 'jsxstyle';

export const MyComponent = () => {
  const matchesThing = useMM('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};`,
      'mock/useMatchMedia-import-renamed.js'
    );
    expect(rv2.js).toContain('/*#__PURE__*/useMM(');

    const rv3 = runExtractStyles(
      `const { Block, useMatchMedia } = require('jsxstyle');

const MyComponent = () => {
  const matchesThing = useMatchMedia('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};

module.exports = MyComponent;`,
      'mock/useMatchMedia-required.js'
    );
    expect(rv3.js).toContain('/*#__PURE__*/useMatchMedia(');

    const rv4 = runExtractStyles(
      `const { Block, useMatchMedia: useMM } = require('jsxstyle');

const MyComponent = () => {
  const matchesThing = useMM('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};

module.exports = MyComponent;`,
      'mock/useMatchMedia-required-renamed.js'
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

  it('extracts shorthand props', () => {
    const source = `
    import { useMatchMedia, Box } from 'jsxstyle';
    import React from 'react';

    export const MyComponent = () => {
      const matchesMQ = useMatchMedia('matchMedia media query');
      return <>
        <Box
          paddingH={matchesMQ && 10}
          paddingLeft={matchesMQ && 20}
        />
        <Box
          paddingH={matchesMQ ? 10 : 30}
          paddingLeft={matchesMQ ? 20 : 40}
        />
      </>;
    };
    `;

    const rv = runExtractStyles(
      source,
      'mock/useMatchMedia-shorthand-props.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./useMatchMedia-shorthand-props__jsxstyle.css\\";
import { useMatchMedia } from 'jsxstyle';
import React from 'react';
export const MyComponent = () => {
  const useMatchMedia_matchesMQ = /*#__PURE__*/useMatchMedia('matchMedia media query');
  return <>
        <div className=\\"_x0 _x1\\" />
        <div className=\\"_x0 _x1 _x2 _x3\\" />
      </>;
};"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/useMatchMedia-shorthand-props.js:12-15 (Box) */
._x2._x2 { padding-left:40px }

/* mock/useMatchMedia-shorthand-props.js:12-15 (Box) */
._x3._x3 { padding-right:30px }

/* mock/useMatchMedia-shorthand-props.js:12-15 (Box) */
/* mock/useMatchMedia-shorthand-props.js:8-11 (Box) */
@media matchMedia media query { ._x0._x0._x0._x0 { padding-left:20px } }

/* mock/useMatchMedia-shorthand-props.js:12-15 (Box) */
/* mock/useMatchMedia-shorthand-props.js:8-11 (Box) */
@media matchMedia media query { ._x1._x1._x1._x1 { padding-right:10px } }
"
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
          fontFamily={matchesMQ && 'serif'}
        />
        <Block
          color={matchesMQ ? 'red' : 'blue'}
          fontFamily={matchesMQ ? 'serif' : 'sans-serif'}
        />
      </>;
    };
    `;

    const rv = runExtractStyles(source, 'mock/useMatchMedia-extraction.js');

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./useMatchMedia-extraction__jsxstyle.css\\";
import { useMatchMedia } from 'jsxstyle';
import React from 'react';
export const MyComponent = () => {
  const useMatchMedia_matchesMQ = /*#__PURE__*/useMatchMedia('matchMedia media query');
  return <>
        <div className=\\"_x0 _x1 _x2\\" />
        <div className=\\"_x0 _x1 _x2 _x3 _x4\\" />
      </>;
};"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/useMatchMedia-extraction.js:12-15 (Block) */
/* mock/useMatchMedia-extraction.js:8-11 (Block) */
._x2 { display:block }

/* mock/useMatchMedia-extraction.js:12-15 (Block) */
._x3 { color:blue }

/* mock/useMatchMedia-extraction.js:12-15 (Block) */
._x4._x4 { font-family:sans-serif }

/* mock/useMatchMedia-extraction.js:12-15 (Block) */
/* mock/useMatchMedia-extraction.js:8-11 (Block) */
@media matchMedia media query { ._x0._x0._x0 { color:red } }

/* mock/useMatchMedia-extraction.js:12-15 (Block) */
/* mock/useMatchMedia-extraction.js:8-11 (Block) */
@media matchMedia media query { ._x1._x1._x1._x1 { font-family:serif } }
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

    const rv = runExtractStyles(
      source,
      'mock/mediaqueries-plus-useMatchMedia.js',
      { warnCallback }
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
        <div className={(useMatchMedia_matchesMQ ? \\"_x2\\" : \\"_x3\\") + \\" _x0 _x1\\"} />
        <div className={(useMatchMedia_matchesMQ ? \\"_x2\\" : \\"_x3\\") + \\" _x0 _x1 _x4\\"} />
      </>;
};"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
/* mock/mediaqueries-plus-useMatchMedia.js:8-12 (Block) */
._x0 { display:block }

/* mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
/* mock/mediaqueries-plus-useMatchMedia.js:8-12 (Block) */
._x1 { example-color:red }

/* mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
/* mock/mediaqueries-plus-useMatchMedia.js:8-12 (Block) */
._x2 { should-remain-inline:consequent }

/* mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
/* mock/mediaqueries-plus-useMatchMedia.js:8-12 (Block) */
._x3 { should-remain-inline:alternate }

/* mock/mediaqueries-plus-useMatchMedia.js:13-18 (Block) */
._x4 { color:blue }
"
`);
  });
});

describe('animation prop', () => {
  it('properly extracts object-type animation props', () => {
    const rv = runExtractStyles(
      `import { Block } from "jsxstyle";
<Block
  animation={{
    '0%, 50%': { opacity: 0, paddingLeft: 30 },
    '100%': { opacity: 1, paddingH: 50 },
  }}
/>`,
      'mock/animation-prop.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./animation-prop__jsxstyle.css\\";
<div className=\\"_x0 _x1\\" />;"
`);
    expect(rv.css).toMatchInlineSnapshot(`
"/* mock/animation-prop.js:2-7 (Block) */
._x0 { display:block }

/* mock/animation-prop.js:2-7 (Block) */
._x1._x1 { animation-name:_x1 }

/* mock/animation-prop.js:2-7 (Block) */
@keyframes _x1 { 0%, 50% { opacity:0; padding-left:30px } 100% { opacity:1; padding-left:50px; padding-right:50px } }
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

    const tsResults = runExtractStyles(src, 'mock/typescript.ts');
    const tsxResults = runExtractStyles(src, 'mock/typescript.tsx');

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

    const evalVars = runExtractStyles(js, 'mock/evaluateVars.js', {
      evaluateVars: true,
    });

    const noEvalVars = runExtractStyles(js, 'mock/evaluateVars.js', {
      evaluateVars: false,
    });

    expect(evalVars.js).not.toEqual(noEvalVars.js);
    expect(evalVars.js).toMatchInlineSnapshot(`
"import \\"./evaluateVars__jsxstyle.css\\";
const staticProp = 'static';
<div className=\\"_x0 _x1 _x2\\" />;"
`);
    expect(noEvalVars.js).toMatchInlineSnapshot(`
"import \\"./evaluateVars__jsxstyle.css\\";
import { Box } from \\"jsxstyle\\";
const staticProp = 'static';
<Box thing1={staticProp} className=\\"_x0 _x1\\" />;"
`);
  });
});

describe('edge cases', () => {
  it('only removes component imports', () => {
    const rv = runExtractStyles(
      `import 'jsxstyle';
import { cache, InvalidComponent, Row as RenamedRow } from 'jsxstyle';
import { Grid } from 'jsxstyle';
// should probably remove this as well
require('jsxstyle');
const { Box } = require('jsxstyle');
const { Block, Col: RenamedCol } = require('jsxstyle');
const { invalid, AlsoInvalid, InlineBlock } = require('jsxstyle');`,
      'mock/edge-case1.js'
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
    const rv = runExtractStyles(fileContent, 'mock/const-sans-init.js');

    expect(rv.js).toMatchInlineSnapshot(`
"import \\"./const-sans-init__jsxstyle.css\\";

for (const thing in things) {
  <div className=\\"_x0\\" />;
}"
`);
  });
});
