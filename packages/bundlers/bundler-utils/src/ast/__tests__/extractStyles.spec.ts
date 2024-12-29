import * as path from 'node:path';
import { createClassNameGetter } from '@jsxstyle/core';
import {
  type ExtractStylesOptions,
  type UserConfigurableOptions,
  extractStyles,
} from '../extractStyles';
import * as LC from './mock/LC';

const LCPath = new URL('./mock/LC', import.meta.url).pathname;

const modulesByAbsolutePath = {
  [LCPath]: LC,
};

process.chdir(__dirname);

const runExtractStyles = (
  src: string,
  sourceFileName: string,
  options: Partial<ExtractStylesOptions> = {},
  userOptions: UserConfigurableOptions = {}
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
    userOptions
  );
};

describe('the basics', () => {
  it('only extracts styles from valid jsxstyle components', () => {
    const rv1 = runExtractStyles(
      `import {Block as TestBlock, Flex, InlineRow, InlineCol} from "@jsxstyle/react";
<Block extract="nope" />;
<TestBlock extract="yep" />;
<Col extract="nope" />;
<InlineBlock extract="nope" />;
<Flex extract="yep" />;
<InlineRow extract="yep" />;
<InlineCol extract="yep" />;`,
      'mock/validate.js'
    );

    expect(rv1.js).toMatchInlineSnapshot(`
      "import "./validate__jsxstyle.css";
      import { Flex } from "@jsxstyle/react";
      <Block extract="nope" />;
      <div className="_x0 _x1" />;
      <Col extract="nope" />;
      <InlineBlock extract="nope" />;
      <Flex extract="yep" />;
      <div className="_x2 _x3 _x4 _x1" />;
      <div className="_x2 _x5 _x1" />;"
    `);

    expect(rv1.css).toMatchInlineSnapshot(`
      "/* mock/validate.js */
      ._x0{display:block}
      ._x1{extract:yep}
      ._x2{display:inline-flex}
      ._x3._x3{flex-direction:row}
      ._x4{align-items:center}
      ._x5._x5{flex-direction:column}
      "
    `);
  });

  it('puts spaces between each class name', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block className="orange" color={thing1 ? "orange" : "purple"} width={thing2 ? 200 : 400} />`,
      'mock/classname-spaces.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./classname-spaces__jsxstyle.css";
      <div className={"orange _x0 " + (thing1 ? "_x1" : "_x2") + " " + (thing2 ? "_x3" : "_x4")} />;"
    `);
  });
});

describe('element conversion', () => {
  it('converts jsxstyle elements to plain elements when all props are static', () => {
    const rv = runExtractStyles(
      `import {Block, css} from "@jsxstyle/react";
import LC from "./LC";
const val = "thing";
<Block
  staticString="wow"
  staticInt={69}
  staticFloat={6.9}
  staticNegativeInt={-420}
  staticValue={val}
  staticMemberExpression={LC.staticValue}
  {...{
    '@media staticObject': {
      key: 'value',
      val,
      staticValue: LC.staticValue,
    }
  }}
  animation={{
    from: { color: 'blue' },
    to: { color: 'red' },
  }}
/>

const className = css({
  staticString: "wow",
  staticInt: 69,
  staticFloat: 6.9,
  staticNegativeInt: -420,
  staticValue: val,
  staticMemberExpression: LC.staticValue,
  '@media staticObject': {
    key: 'value',
    val,
    staticValue: LC.staticValue,
  },
  animation: {
    from: { color: 'blue' },
    to: { color: 'red' },
  },
});
`,
      'mock/extract-static1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./extract-static1__jsxstyle.css";
      import LC from "./LC";
      const val = "thing";
      <div className="_xa _x0 _x1 _x2 _x3 _x4 _x5 _x6 _x7 _x8 _x9" />;
      const className = "_x0 _x1 _x2 _x3 _x4 _x5 _x6 _x7 _x8 _x9";"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/extract-static1.js */
      ._x0{static-string:wow}
      ._x1{static-int:69px}
      ._x2{static-float:6.9px}
      ._x3{static-negative-int:-420px}
      ._x4{static-value:thing}
      ._x5{static-member-expression:ok}
      ._x9._x9{animation-name:_x9}
      ._xa{display:block}
      @keyframes _x9{from{color:blue}to{color:red}}
      @media staticObject{._x6._x6._x6{key:value}}
      @media staticObject{._x7._x7._x7{val:thing}}
      @media staticObject{._x8._x8._x8{static-value:ok}}
      "
    `);
  });

  it('converts jsxstyle elements to Block elements when some props aren\u2019t static', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
const val = "thing";
import LC from "./LC";
<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} dynamicValue={notStatic} />`,
      'mock/extract-static2.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./extract-static2__jsxstyle.css";
      import { Box } from "@jsxstyle/react";
      const val = "thing";
      import LC from "./LC";
      <Box dynamicValue={notStatic} className="_x0 _x1 _x2 _x3 _x4" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/extract-static2.js */
      ._x0{display:block}
      ._x1{static-string:wow}
      ._x2{static-int:69px}
      ._x3{static-value:thing}
      ._x4{static-member-expression:ok}
      "
    `);
  });
});

describe('spread operators', () => {
  it.skip("doesn't explode if you use the spread operator", () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
const BlueBlock = ({wow, ...props}) => <Block color="blue" {...props} test="wow" />;
const DynamicBlock = ({wow, ...props}) => <Block dynamicProp={wow} {...props} />;`,
      'mock/rest-spread.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import { Block } from "@jsxstyle/react";
      const BlueBlock = ({
        wow,
        ...props
      }) => <Block color="blue" {...props} test="wow" />;
      const DynamicBlock = ({
        wow,
        ...props
      }) => <Block dynamicProp={wow} {...props} />;"
    `);
  });

  it.skip('handles props mixed with spread operators', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block doNotExtract="no" {...spread} extract="yep" />`,
      'mock/spread.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import { Block } from "@jsxstyle/react";
      <Block doNotExtract="no" {...spread} extract="yep" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`""`);
  });

  it.skip('handles reserved props before the spread operators', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
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
      "import { Block } from "jsxstyle";
      <Block className={wow} component="wow" props={{
        test: 4
      }} key={test} ref={test} style={{}} {...spread} color="red" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`""`);
  });

  it('extracts spreads from trusted sources', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
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
      "import "./trusted-spreads__jsxstyle.css";
      import LC from "./LC";
      const staticSpread = {
        color: "#444",
        "width": 420
      };
      function Thing(props) {
        return <div className="_x0 _x1 _x2 _x3 _x4 _x5" />;
      }"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/trusted-spreads.js */
      ._x0{display:block}
      ._x1{width:420px}
      ._x2{border-radius:4px}
      ._x3{box-shadow:0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07)}
      ._x4._x4{background-color:#FFF}
      ._x5{color:#444}
      "
    `);
  });
});

describe('jsxstyle-specific props', () => {
  it('handles the `props` prop correctly', () => {
    const warnCallback = vi.fn();

    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
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
      "import "./props-prop1__jsxstyle.css";
      import { Box } from "@jsxstyle/react";
      <div {...{
        staticObject: "yep"
      }} className="_x0" />;
      <div {...{}} className="_x0" />;
      <div {...variable} className="_x0" />;
      <div {...calledFunction()} className="_x0" />;
      <div {...member.expression} className="_x0" />;
      <div {...{
        objectShorthand
      }} className="_x0" />;
      <div {...{
        ...one,
        two: {
          three,
          four: "five",
          ...six
        }
      }} className="_x0 _x1" />;
      <div {...{
        "aria-hidden": true
      }} className="_x0" />;
      <div {...{
        className: "test"
      }} className="_x0" />;
      <div {...{
        style: "test"
      }} className="_x0" />;
      <div {..."invalid"} className="_x0" />;
      <Box dynamicProp={wow} props="invalid" className="_x0" />;
      <div {...{
        "aria hidden": true
      }} className="_x0" />;
      <div {...{
        "-aria-hidden": true
      }} className="_x0" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/props-prop1.js */
      ._x0{display:block}
      ._x1{seven:eight}
      "
    `);
  });

  it('does not attempt to extract a ref prop found on a jsxstyle component', () => {
    const warnCallback = vi.fn();

    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block color="red" ref={this.cannotBeExtracted} />`,
      'mock/props-prop2.js',
      { warnCallback }
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./props-prop2__jsxstyle.css";
      import { Box } from "@jsxstyle/react";
      <Box ref={this.cannotBeExtracted} className="_x0 _x1" />;"
    `);

    expect(warnCallback).toHaveBeenCalledTimes(1);
    expect(warnCallback).toHaveBeenCalledWith(
      'The `ref` prop cannot be extracted from a jsxstyle component. If you want to attach a ref to the underlying component or element, specify a `ref` property in the `props` object.'
    );
  });

  it('handles the `component` prop correctly', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block component="input" />;
<Block component={Thing} />;
<Block component={thing.cool} />;
<Block component="h1" {...spread} />;
<Block before="wow" component="h1" dynamic={wow} color="red" />;`,
      'mock/component-prop1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./component-prop1__jsxstyle.css";
      import { Box } from "@jsxstyle/react";
      import { Block } from "@jsxstyle/react";
      <input className="_x0" />;
      <Thing className="_x0" />;
      <thing.cool className="_x0" />;
      <Block component="h1" {...spread} />;
      <Box component="h1" dynamic={wow} className="_x0 _x1 _x2" />;"
    `);

    const warnCallback = vi.fn();

    runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block component="CapitalisedString" />`,
      'mock/component-prop2.js',
      { warnCallback }
    );

    expect(warnCallback.mock.lastCall).toMatchInlineSnapshot(`
      [
        "Component prop value \`%s\` could not be safely extracted.",
        ""CapitalisedString"",
      ]
    `);
    warnCallback.mockClear();

    runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block component={lowercaseIdentifier} />`,
      'mock/component-prop3.js',
      { warnCallback }
    );

    expect(warnCallback.mock.lastCall).toMatchInlineSnapshot(`
      [
        "Component prop value \`%s\` could not be safely extracted.",
        "lowercaseIdentifier",
      ]
    `);
    warnCallback.mockClear();

    runExtractStyles(
      `import {Block} from "@jsxstyle/react";
    <Block component={functionCall()} />`,
      'mock/component-prop4.js',
      { warnCallback }
    );

    expect(warnCallback.mock.lastCall).toMatchInlineSnapshot(`
      [
        "Component prop value \`%s\` could not be safely extracted.",
        "functionCall()",
      ]
    `);
    warnCallback.mockClear();

    runExtractStyles(
      `import {Block} from "@jsxstyle/react";
    <Block component={member.expression()} />`,
      'mock/component-prop4.js',
      { warnCallback }
    );

    expect(warnCallback.mock.lastCall).toMatchInlineSnapshot(`
      [
        "Component prop value \`%s\` could not be safely extracted.",
        "member.expression()",
      ]
    `);
    warnCallback.mockClear();
  });

  it('ignores complex `component` prop values', () => {
    const warnCallback = vi.fn();

    const rv = runExtractStyles(
      `import { Block } from "@jsxstyle/react";
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
    expect(warnCallback.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Component prop value \`%s\` could not be safely extracted.",
          "Compy || 'h1'",
        ],
        [
          "Component prop value \`%s\` could not be safely extracted.",
          "complex",
        ],
        [
          "Component prop value \`%s\` could not be safely extracted.",
          ""Complex"",
        ],
        [
          "Component prop value \`%s\` could not be safely extracted.",
          "complex",
        ],
      ]
    `);
    expect(rv.js).toMatchInlineSnapshot(`
      "import "./funky-component-prop__jsxstyle.css";
      import { Box } from "@jsxstyle/react";
      function Test({
        component,
        thing
      }) {
        const Compy = component;
        <Box component={Compy || 'h1'} className="_x0">
          <Box component={complex} className="_x0">
            <Box component="Complex" className="_x0" />
          </Box>
        </Box>;
        <Box component={complex} className="_x0" />;
      }"
    `);
  });

  it('handles the `className` prop correctly', () => {
    const rv1 = runExtractStyles(
      `import {Block, Row} from "@jsxstyle/react";
<Row className={member.expression} {...spread} />;
<Block className="orange" />;`,
      'mock/class-name1.js'
    );

    expect(rv1.js).toMatchInlineSnapshot(`
      "import "./class-name1__jsxstyle.css";
      import { Row } from "@jsxstyle/react";
      <Row className={member.expression} {...spread} />;
      <div className="_x0 orange" />;"
    `);
  });

  // TODO(meyer) delete this test when jsxstyle 3 ships
  it('ignores the `mediaQueries` prop', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block
  mediaQueries={{ sm: "only screen and (min-width: 640px)" }}
  width={640}
  smWidth="100%"
  {...{
    '& banana': {
      color: 'blue'
    },
    '@media wow': {
      '& banana': {
        color: 'blue'
      },
      ok: 123
    }
  }}
/>;`,
      'mock/media-queries.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./media-queries__jsxstyle.css";
      <div mediaQueries={{
        sm: "only screen and (min-width: 640px)"
      }} className="_x0 _x1 _x2 _x3 _x4 _x5" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/media-queries.js */
      ._x0{display:block}
      ._x1{width:640px}
      ._x2{sm-width:100%}
      ._x3 banana{color:blue}
      @media wow{._x4._x4._x4 banana{color:blue}}
      @media wow{._x5._x5._x5{ok:123px}}
      "
    `);
  });

  it('evaluates the `mediaQueries` prop correctly', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
import LC from "./LC";
<Block
  mediaQueries={LC.mediaQueries}
  width={640}
  smWidth="100%"
/>;`,
      'mock/media-queries.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./media-queries__jsxstyle.css";
      import LC from "./LC";
      <div mediaQueries={LC.mediaQueries} className="_x0 _x1 _x2" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/media-queries.js */
      ._x0{display:block}
      ._x1{width:640px}
      ._x2{sm-width:100%}
      "
    `);
  });
});

describe('ternaries', () => {
  it('extracts a ternary expression that has static consequent and alternate', () => {
    const rv = runExtractStyles(
      `import { Block } from "@jsxstyle/react";
<Block color={dynamic ? "red" : "blue"} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./ternary__jsxstyle.css";
      <div className={"_x0 " + (dynamic ? "_x1" : "_x2")} />;"
    `);

    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/ternary.js */
      ._x0{display:block}
      ._x1{color:red}
      ._x2{color:blue}
      "
    `);
  });

  it('extracts a conditional expression with a static right side and an AND operator', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block color={dynamic && "red"} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./ternary__jsxstyle.css";
      <div className={"_x0 " + (dynamic ? "_x1" : "")} />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/ternary.js */
      ._x0{display:block}
      ._x1{color:red}
      "
    `);
  });

  it.skip('extracts a conditional expression with a static right side and an OR operator', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block color={dynamic || "red"} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot();
    expect(rv.css).toMatchInlineSnapshot();
  });

  it('extracts a ternary expression that has a static consequent and alternate', () => {
    const rv = runExtractStyles(
      `import LC from "./LC";
import {Block} from "@jsxstyle/react";
const blue = "blueberry";
<Block color={dynamic ? LC.red : blue} />`,
      'mock/ternary.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./ternary__jsxstyle.css";
      import LC from "./LC";
      const blue = "blueberry";
      <div className={"_x0 " + (dynamic ? "_x1" : "_x2")} />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/ternary.js */
      ._x0{display:block}
      ._x1{color:strawberry}
      ._x2{color:blueberry}
      "
    `);
  });

  it('extracts a ternary expression from a component that has a className specified', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block className="cool" color={dynamic ? "red" : "blue"} />`,
      'mock/ternary-with-classname.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./ternary-with-classname__jsxstyle.css";
      <div className={"cool _x0 " + (dynamic ? "_x1" : "_x2")} />;"
    `);

    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/ternary-with-classname.js */
      ._x0{display:block}
      ._x1{color:red}
      ._x2{color:blue}
      "
    `);
  });

  it.skip('extracts a ternary expression from a component that has a spread operator specified', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block {...spread} color={dynamic ? "red" : "blue"} />`,
      'mock/ternary-with-spread.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import { Block } from "jsxstyle";
      <Block {...spread} color={dynamic ? "red" : "blue"} />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`""`);
  });

  it('positivizes binary expressions', () => {
    const rv1 = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
  <Block
    thing1={dynamic === 4 && "four"}
    thing2={dynamic !== 4 && "not four"}
    thing3={dynamic === 4 ? "four" : "not four"}
    thing4={dynamic !== 4 ? "not four" : "four"}
  />`,
      'mock/binary-expressions.js'
    );

    const rv2 = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
  <Block
    thing1={dynamic == 4 && "four"}
    thing2={dynamic != 4 && "not four"}
    thing3={dynamic == 4 ? "four" : "not four"}
    thing4={dynamic != 4 ? "not four" : "four"}
  />`,
      'mock/binary-expressions.js'
    );

    expect(rv1.js).toMatchInlineSnapshot(`
      "import "./binary-expressions__jsxstyle.css";
      <div className={"_x0 " + (dynamic === 4 ? "_x1 _x2 _x3" : "_x4 _x5 _x6")} />;"
    `);
    expect(rv2.js).toMatchInlineSnapshot(`
      "import "./binary-expressions__jsxstyle.css";
      <div className={"_x0 " + (dynamic == 4 ? "_x1 _x2 _x3" : "_x4 _x5 _x6")} />;"
    `);
    expect(rv1.css).toEqual(rv2.css);
    expect(rv1.css).toMatchInlineSnapshot(`
      "/* mock/binary-expressions.js */
      ._x0{display:block}
      ._x1{thing1:four}
      ._x2{thing3:four}
      ._x3{thing4:four}
      ._x4{thing2:not four}
      ._x5{thing3:not four}
      ._x6{thing4:not four}
      "
    `);
  });

  it('positivizes unary expressions', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
    <Block
      thing1={dynamic % 2 && "mod 2"}
      thing2={!(dynamic % 2) && "not mod 2"}
      thing3={dynamic % 2 ? "mod 2" : "not mod 2"}
      thing4={!(dynamic % 2) ? "not mod 2" : "mod 2"}
    />`,
      'mock/unary-expressions.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./unary-expressions__jsxstyle.css";
      <div className={"_x0 " + (dynamic % 2 ? "_x1 _x2 _x3" : "_x4 _x5 _x6")} />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/unary-expressions.js */
      ._x0{display:block}
      ._x1{thing1:mod 2}
      ._x2{thing3:mod 2}
      ._x3{thing4:mod 2}
      ._x4{thing2:not mod 2}
      ._x5{thing3:not mod 2}
      ._x6{thing4:not mod 2}
      "
    `);
  });

  it('ignores a ternary expression that comes before a spread operator', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block color={dynamic ? "red" : "blue"} {...spread} className="cool" />`,
      'mock/ternary-with-classname.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import { Block } from "@jsxstyle/react";
      <Block color={dynamic ? "red" : "blue"} {...spread} className="cool" />;"
    `);
  });

  it('groups extracted ternary statements', () => {
    const rv = runExtractStyles(
      `import {Block} from "@jsxstyle/react";
<Block color={dynamic ? "red" : "blue"} width={dynamic ? 200 : 400} />`,
      'mock/ternary-groups.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./ternary-groups__jsxstyle.css";
      <div className={"_x0 " + (dynamic ? "_x1 _x2" : "_x3 _x4")} />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/ternary-groups.js */
      ._x0{display:block}
      ._x1{color:red}
      ._x2{width:200px}
      ._x3{color:blue}
      ._x4{width:400px}
      "
    `);
  });

  it('handles nullish values in ternaries correctly', () => {
    const rv = runExtractStyles(
      `
import {Block} from "@jsxstyle/react";
<Block color={dynamic1 ? null : "blue"} />;
<Block color={dynamic2 ? undefined : "blue"} />;
`,
      'mock/ternary-null-values.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./ternary-null-values__jsxstyle.css";
      <div className={"_x0 " + (dynamic1 ? "" : "_x1")} />;
      <div className={"_x0 " + (dynamic2 ? "" : "_x1")} />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/ternary-null-values.js */
      ._x0{display:block}
      ._x1{color:blue}
      "
    `);
  });
});

describe('useMatchMedia', () => {
  it('marks useMatchMedia calls as pure', () => {
    const rv1 = runExtractStyles(
      `import { Block, useMatchMedia } from '@jsxstyle/react';

export const MyComponent = () => {
  const matchesThing = useMatchMedia('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};`,
      'mock/useMatchMedia-import.js'
    );

    expect(rv1.js).toContain('/*#__PURE__*/useMatchMedia(');

    const rv2 = runExtractStyles(
      `import { Block, useMatchMedia as useMM } from '@jsxstyle/react';

export const MyComponent = () => {
  const matchesThing = useMM('thing');
  return <Block width={matchesThing ? 100 : 200} />;
};`,
      'mock/useMatchMedia-import-renamed.js'
    );
    expect(rv2.js).toContain('/*#__PURE__*/useMM(');
  });

  it('removes unused hook calls that are marked as "pure"', async () => {
    const source = `
import { useMatchMedia, Block } from '@jsxstyle/react';
import React from 'react';

export const MyComponent = () => {
  const unusedThing1 = /* #__PURE__ */ useMatchMedia('this call gets minified out');
  const unusedThing2 = useMatchMedia('this call stays');
  const usedThing = /* #__PURE__ */ useMatchMedia('this call stays as well');

  return React.createElement(Block, { usedThing });
};
`;

    const terser = await import('terser');

    const minifyOutput = await terser.minify(source, {
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
      "import { useMatchMedia, Block } from "@jsxstyle/react";

      import React from "react";

      export const MyComponent = () => {
          useMatchMedia("this call stays");
          const usedThing = useMatchMedia("this call stays as well");
          return React.createElement(Block, {
              usedThing: usedThing
          });
      };"
    `);
  });

  it('extracts shorthand props', () => {
    const source = `
    import { useMatchMedia, Box } from '@jsxstyle/react';
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
      "import "./useMatchMedia-shorthand-props__jsxstyle.css";
      import { useMatchMedia } from '@jsxstyle/react';
      import React from 'react';
      export const MyComponent = () => {
        const useMatchMedia_matchesMQ = /*#__PURE__*/useMatchMedia('matchMedia media query');
        return <>
              <div className="_x0 _x1" />
              <div className="_x0 _x1 _x2 _x3" />
            </>;
      };"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/useMatchMedia-shorthand-props.js */
      ._x2._x2{padding-left:40px}
      ._x3._x3{padding-right:30px}
      @media matchMedia media query{._x0._x0._x0._x0{padding-left:20px}}
      @media matchMedia media query{._x1._x1._x1._x1{padding-right:10px}}
      "
    `);
  });

  it('extracts ternaries and conditional statements', () => {
    const source = `
    import { useMatchMedia, Block } from '@jsxstyle/react';
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
      "import "./useMatchMedia-extraction__jsxstyle.css";
      import { useMatchMedia } from '@jsxstyle/react';
      import React from 'react';
      export const MyComponent = () => {
        const useMatchMedia_matchesMQ = /*#__PURE__*/useMatchMedia('matchMedia media query');
        return <>
              <div className="_x0 _x1 _x2" />
              <div className="_x0 _x1 _x2 _x3 _x4" />
            </>;
      };"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/useMatchMedia-extraction.js */
      ._x0{display:block}
      ._x3{color:blue}
      ._x4._x4{font-family:sans-serif}
      @media matchMedia media query{._x1._x1._x1{color:red}}
      @media matchMedia media query{._x2._x2._x2._x2{font-family:serif}}
      "
    `);
  });
});

describe('animation prop', () => {
  it('properly extracts object-type animation props', () => {
    const rv = runExtractStyles(
      `import { Block } from "@jsxstyle/react";
<Block
  animation={{
    '0%, 50%': { opacity: 0, paddingLeft: 30 },
    '100%': { opacity: 1, paddingH: 50 },
  }}
/>`,
      'mock/animation-prop.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./animation-prop__jsxstyle.css";
      <div className="_x0 _x1" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/animation-prop.js */
      ._x0{display:block}
      ._x1._x1{animation-name:_x1}
      @keyframes _x1{0%, 50%{opacity:0;padding-left:30px}100%{opacity:1;padding-left:50px;padding-right:50px}}
      "
    `);
  });
});

describe('TypeScript support', () => {
  it('enables the `typescript` parser plugin for ts/tsx files', () => {
    const src = `import * as React from 'react';
import { Block } from '@jsxstyle/react';
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
      "import "./typescript__jsxstyle.css";
      import * as React from 'react';
      export interface ThingProps {
        thing1: string;
        thing2?: boolean;
      }
      export const Thing: React.FC<ThingProps> = props => <div className="_x0" />;
      ReactDOM.render(<Thing />, document.getElementById('root') as HTMLElement);"
    `);
    expect(tsxResults.js).toMatchInlineSnapshot(`
      "import "./typescript__jsxstyle.css";
      import * as React from 'react';
      export interface ThingProps {
        thing1: string;
        thing2?: boolean;
      }
      export const Thing: React.FC<ThingProps> = props => <div className="_x0" />;
      ReactDOM.render(<Thing />, document.getElementById('root') as HTMLElement);"
    `);
  });
});

describe('evaluateVars config option', () => {
  it('does not evaluate vars if evaluateVars is set to false', () => {
    const js = `import { Block } from '@jsxstyle/react';
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
      "import "./evaluateVars__jsxstyle.css";
      const staticProp = 'static';
      <div className="_x0 _x1 _x2" />;"
    `);
    expect(noEvalVars.js).toMatchInlineSnapshot(`
      "import "./evaluateVars__jsxstyle.css";
      import { Box } from "@jsxstyle/react";
      const staticProp = 'static';
      <Box thing1={staticProp} className="_x0 _x1" />;"
    `);
  });
});

describe('cssMode config option', () => {
  const js = `import { Block } from '@jsxstyle/react';
const staticProp = 'static';
<Block thing1={staticProp} thing2={69}></Block>;
<Block thing3={staticProp} thing4={69}></Block>;
`;

  it('prepends one import when cssMode is set to "singleInlineImport"', () => {
    const singleInlineImports = runExtractStyles(
      js,
      'mock/evaluateVars.js',
      undefined,
      {
        cssMode: 'singleInlineImport',
      }
    );

    expect(singleInlineImports.js).toMatchInlineSnapshot(`
      "import "@jsxstyle/core/cache/mock/evaluateVars.js.css!=!@jsxstyle/webpack-plugin/base64-loader?value=!@jsxstyle/bundler-utils/noop";
      const staticProp = 'static';
      <div className="_x0 _x1 _x2"></div>;
      <div className="_x0 _x3 _x4"></div>;"
    `);
    expect(singleInlineImports.css).toEqual('');
  });

  it('prepends one import per rule when cssMode is set to "multipleInlineImports"', () => {
    const multipleInlineImports = runExtractStyles(
      js,
      'mock/evaluateVars.js',
      undefined,
      {
        cssMode: 'multipleInlineImports',
      }
    );

    expect(multipleInlineImports.js).toMatchInlineSnapshot(`
      "// ._x0{display:block}
      import "@jsxstyle/core/cache/_x0.css!=!@jsxstyle/webpack-plugin/base64-loader?value=Ll94MHtkaXNwbGF5OmJsb2NrfQ%3D%3D!@jsxstyle/bundler-utils/noop";
      // ._x1{thing1:static}
      import "@jsxstyle/core/cache/_x1.css!=!@jsxstyle/webpack-plugin/base64-loader?value=Ll94MXt0aGluZzE6c3RhdGljfQ%3D%3D!@jsxstyle/bundler-utils/noop";
      // ._x2{thing2:69px}
      import "@jsxstyle/core/cache/_x2.css!=!@jsxstyle/webpack-plugin/base64-loader?value=Ll94Mnt0aGluZzI6NjlweH0%3D!@jsxstyle/bundler-utils/noop";
      // ._x3{thing3:static}
      import "@jsxstyle/core/cache/_x3.css!=!@jsxstyle/webpack-plugin/base64-loader?value=Ll94M3t0aGluZzM6c3RhdGljfQ%3D%3D!@jsxstyle/bundler-utils/noop";
      // ._x4{thing4:69px}
      import "@jsxstyle/core/cache/_x4.css!=!@jsxstyle/webpack-plugin/base64-loader?value=Ll94NHt0aGluZzQ6NjlweH0%3D!@jsxstyle/bundler-utils/noop";
      const staticProp = 'static';
      <div className="_x0 _x1 _x2"></div>;
      <div className="_x0 _x3 _x4"></div>;"
    `);
    expect(multipleInlineImports.css).toEqual('');
  });

  it('prepends a <style> element to existing JSX when cssMode is set to "styled-jsx"', () => {
    const multipleInlineImports = runExtractStyles(
      js,
      'mock/evaluateVars.js',
      undefined,
      {
        cssMode: 'styled-jsx',
      }
    );

    expect(multipleInlineImports.js).toMatchInlineSnapshot(`
      "const staticProp = 'static';
      <div className="_x0 _x1 _x2"><style jsx global>{\`._x0{display:block} ._x1{thing1:static} ._x2{thing2:69px}\`}</style></div>;
      <div className="_x0 _x3 _x4"><style jsx global>{\`._x0{display:block} ._x3{thing3:static} ._x4{thing4:69px}\`}</style></div>;"
    `);
    expect(multipleInlineImports.css).toEqual('');
  });

  it('throws an error for self-closing jsxstyle elements when cssMode is set to "styled-jsx"', () => {
    expect(() =>
      runExtractStyles(
        `import { Block } from '@jsxstyle/react';
const staticProp = 'static';
<Block thing1={staticProp} thing2={69} />;
`,
        'mock/evaluateVars.js',
        undefined,
        {
          cssMode: 'styled-jsx',
        }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `[Invariant Violation: Encountered a self-closing jsxstyle element. Style injection will be skipped.]`
    );
  });
});

describe('makeCustomProperties function', () => {
  it('extracts styles', () => {
    const rv = runExtractStyles(
      `import { makeCustomProperties } from '@jsxstyle/react';
const props = makeCustomProperties({
  prop1: 'prop1 value',
  prop2: 123,
}).addVariant('banana', {
  prop1: 'banana prop1 value',
}, {
  mediaQuery: 'mq',
}).build()
`,
      'mock/custom-properties1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./custom-properties1__jsxstyle.css";
      const props = {
        prop1: "var(--jsxstyle-prop1)",
        prop2: "var(--jsxstyle-prop2)",
        variantNames: ["default", "banana"],
        variants: {
          default: {
            className: "jsxstyle_default"
          },
          banana: {
            className: "jsxstyle_banana",
            mediaQuery: "@media mq"
          }
        },
        styles: [":root{--jsxstyle-prop1:prop1 value;--jsxstyle-prop2:123px}", ":root:not(.\\\\9).jsxstyle_default{--jsxstyle-prop1:prop1 value;--jsxstyle-prop2:123px}", ":root:not(.\\\\9).jsxstyle_banana{--jsxstyle-prop1:banana prop1 value}", "@media mq{:root:not(.\\\\9){--jsxstyle-prop1:banana prop1 value}}"]
      };"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/custom-properties1.js */
      :root:not(.\\9).jsxstyle_banana{--jsxstyle-prop1:banana prop1 value}
      :root:not(.\\9).jsxstyle_default{--jsxstyle-prop1:prop1 value;--jsxstyle-prop2:123px}
      :root{--jsxstyle-prop1:prop1 value;--jsxstyle-prop2:123px}
      @media mq{:root:not(.\\9){--jsxstyle-prop1:banana prop1 value}}
      "
    `);
  });

  it('extracts styles with options', () => {
    const rv = runExtractStyles(
      `import { makeCustomProperties } from '@jsxstyle/react';
const props = makeCustomProperties({
  prop1: 'prop1 value',
  prop2: 123,
}).addVariant('banana', {
  prop1: 'banana prop1 value',
}, {
  mediaQuery: 'mq',
}).build({
  namespace: 'test',
  mangle: true,
})
`,
      'mock/custom-properties1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./custom-properties1__jsxstyle.css";
      const props = {
        prop1: "var(--test0)",
        prop2: "var(--test1)",
        variantNames: ["default", "banana"],
        variants: {
          default: {
            className: "test_default"
          },
          banana: {
            className: "test_banana",
            mediaQuery: "@media mq"
          }
        },
        styles: [":root{--test0:prop1 value;--test1:123px}", ":root:not(.\\\\9).test_default{--test0:prop1 value;--test1:123px}", ":root:not(.\\\\9).test_banana{--test0:banana prop1 value}", "@media mq{:root:not(.\\\\9){--test0:banana prop1 value}}"]
      };"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/custom-properties1.js */
      :root:not(.\\9).test_banana{--test0:banana prop1 value}
      :root:not(.\\9).test_default{--test0:prop1 value;--test1:123px}
      :root{--test0:prop1 value;--test1:123px}
      @media mq{:root:not(.\\9){--test0:banana prop1 value}}
      "
    `);
  });

  it('extracts nested styles', () => {
    const rv = runExtractStyles(
      `import { makeCustomProperties } from '@jsxstyle/react';
const props = makeCustomProperties({
  prop1: 'prop1 value',
  prop2: 123,
  nested: {
    prop3: 'nested prop3 value',
    nested2: {
      prop4: 'nested2 prop4 value',
    }
  }
}).addVariant('banana', {
  prop1: 'banana prop1 value',
  nested: {
    nested2: {
      prop4: 'banana nested2 prop4 value',
    }
  }
}, {
  mediaQuery: 'mq',
}).build({
  namespace: 'test',
  mangle: true,
})
`,
      'mock/custom-properties1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./custom-properties1__jsxstyle.css";
      const props = {
        prop1: "var(--test0)",
        prop2: "var(--test1)",
        nested: {
          prop3: "var(--test2)",
          nested2: {
            prop4: "var(--test3)"
          }
        },
        variantNames: ["default", "banana"],
        variants: {
          default: {
            className: "test_default"
          },
          banana: {
            className: "test_banana",
            mediaQuery: "@media mq"
          }
        },
        styles: [":root{--test0:prop1 value;--test1:123px;--test2:nested prop3 value;--test3:nested2 prop4 value}", ":root:not(.\\\\9).test_default{--test0:prop1 value;--test1:123px;--test2:nested prop3 value;--test3:nested2 prop4 value}", ":root:not(.\\\\9).test_banana{--test0:banana prop1 value;--test3:banana nested2 prop4 value}", "@media mq{:root:not(.\\\\9){--test0:banana prop1 value;--test3:banana nested2 prop4 value}}"]
      };"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/custom-properties1.js */
      :root:not(.\\9).test_banana{--test0:banana prop1 value;--test3:banana nested2 prop4 value}
      :root:not(.\\9).test_default{--test0:prop1 value;--test1:123px;--test2:nested prop3 value;--test3:nested2 prop4 value}
      :root{--test0:prop1 value;--test1:123px;--test2:nested prop3 value;--test3:nested2 prop4 value}
      @media mq{:root:not(.\\9){--test0:banana prop1 value;--test3:banana nested2 prop4 value}}
      "
    `);
  });
});

describe('css function', () => {
  it('handles nested CSS function calls', () => {
    const rv = runExtractStyles(
      `import { css } from '@jsxstyle/react';
const kitchenSink = css(
  {
    display: 'block',
  },
  css(
    { color: 'red' },
    css(
      { color: 'green' },
      css(
        { color: 'blue' }
      )
    )
  )
);
`,
      'mock/css-function1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./css-function1__jsxstyle.css";
      const kitchenSink = "_x0 _x1 _x2 _x3";"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/css-function1.js */
      ._x0{color:blue}
      ._x1{color:green}
      ._x2{color:red}
      ._x3{display:block}
      "
    `);
  });

  it('handles multiple params', () => {
    const rv = runExtractStyles(
      `import { css } from '@jsxstyle/react';
const kitchenSink = css(
  {
    display: 'block',
    conditionalProp: condition && 'conditionalValue',
    unextractable: mysteryValue,
  },
  condition && {
    item1: 'value1',
    item2: 'value2',
  },
  someValue,
  condition && 'string value',
  condition ? 'another value' : '',
  css({
    color: 'red'
  })
);
`,
      'mock/css-function1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./css-function1__jsxstyle.css";
      import { css } from '@jsxstyle/react';
      const kitchenSink = "_x0 _x1 " + (condition ? "_x2" : "") + " " + (condition ? "_x3 _x4" : "") + " " + css({
        "unextractable": mysteryValue
      }, someValue, condition && 'string value', condition && 'another value');"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/css-function1.js */
      ._x0{color:red}
      ._x1{display:block}
      ._x2{conditional-prop:conditionalValue}
      ._x3{item1:value1}
      ._x4{item2:value2}
      "
    `);
  });

  it('does not generate a string wrapped in a JSX expression container', () => {
    const rv = runExtractStyles(
      `import { css } from '@jsxstyle/react';
<div className={css({ color: 'blue' })} />;
`,
      'mock/css-function2.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./css-function2__jsxstyle.css";
      <div className="_x0" />;"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/css-function2.js */
      ._x0{color:blue}
      "
    `);
  });

  it('works', () => {
    const rv = runExtractStyles(
      `import { css } from '@jsxstyle/react';
css({ display: 'contents' });
`,
      'mock/css-function3.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./css-function3__jsxstyle.css";
      "_x0";"
    `);
    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/css-function3.js */
      ._x0{display:contents}
      "
    `);
  });
});

describe('zero runtime mode', () => {
  it('works', () => {
    const errorCallback = vi.fn();

    const rv = runExtractStyles(
      `
import { Grid, Block, css, useMatchMedia, cache } from '@jsxstyle/react';
<Grid color={wow} />;
<Block color={wow} />;
<Block component="a" onClick={wow} href="https://jsx.style" color="red" />;
css({ color: wow });
css({ color: 'red' });
cache.injectOptions({});
const exampleMQ = useMatchMedia('screen and test');
<Block color={exampleMQ ? 'red' : 'blue'} />;
`,
      'mock/no-runtime1.js',
      {
        errorCallback,
      },
      {
        noRuntime: true,
      }
    );

    expect(errorCallback).toHaveBeenCalledTimes(6);
    expect(errorCallback.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Could not evaluate prop \`%s\` (value: %s)",
          "color",
          "wow",
        ],
        [
          "Could not evaluate prop \`%s\` (value: %s)",
          "color",
          "wow",
        ],
        [
          "Could not evaluate prop \`%s\` (value: %s)",
          "color",
          "wow",
        ],
        [
          "Runtime jsxstyle could not be completely removed:
      %s",
          "Box",
        ],
        [
          "Runtime jsxstyle could not be completely removed:
      %s",
          "Box",
        ],
        [
          "Runtime jsxstyle could not be completely removed:
      %s",
          "css",
        ],
      ]
    `);

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./no-runtime1__jsxstyle.css";
      import { Box } from "@jsxstyle/react";
      import { css, useMatchMedia, cache } from '@jsxstyle/react';
      <Box color={wow} className="_x1" />;
      <Box color={wow} className="_x2" />;
      <a onClick={wow} href="https://jsx.style" className="_x2 _x0" />;
      "" + css({
        "color": wow
      });
      "_x0";
      cache.injectOptions({});
      const useMatchMedia_exampleMQ = /*#__PURE__*/useMatchMedia('screen and test');
      <div className="_x2 _x3 _x4" />;"
    `);

    expect(rv.css).toMatchInlineSnapshot(`
      "/* mock/no-runtime1.js */
      ._x0{color:red}
      ._x1{display:grid}
      ._x2{display:block}
      ._x4{color:blue}
      @media screen and test{._x3._x3._x3{color:red}}
      "
    `);
  });
});

describe('edge cases', () => {
  it('removes unused imports', () => {
    const rv = runExtractStyles(
      `import '@jsxstyle/react';
import { cache, InvalidComponent, Row as RenamedRow } from '@jsxstyle/react';
import { Grid } from '@jsxstyle/react';
`,
      'mock/edge-case1.js'
    );

    expect(rv.js).toMatchInlineSnapshot(`"import '@jsxstyle/react';"`);
  });

  it('handles consts with no inits', () => {
    const fileContent = `
import { Block } from '@jsxstyle/react';
for (const thing in things) {
  <Block />;
}
`;
    const rv = runExtractStyles(fileContent, 'mock/const-sans-init.js');

    expect(rv.js).toMatchInlineSnapshot(`
      "import "./const-sans-init__jsxstyle.css";
      for (const thing in things) {
        <div className="_x0" />;
      }"
    `);
  });
});
