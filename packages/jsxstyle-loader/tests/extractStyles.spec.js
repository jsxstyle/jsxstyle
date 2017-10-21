'use strict';

const path = require('path');

const extractStyles = require('../utils/ast/extractStyles');

const whitelistedModules = [require.resolve('./mock/LC')];

const pathTo = thing => path.resolve(__dirname, thing);

describe('the basics', function() {
  it('only extracts styles from valid jsxstyle components', () => {
    const rv1 = extractStyles({
      src: `import {Block as TestBlock} from "jsxstyle";
const {Col: TestCol, Row} = require("jsxstyle");
<Block extract="nope" />;
<TestBlock extract="yep" />;
<Row extract="yep" />;
<Col extract="nope" />;
<InlineBlock extract="nope" />;
<TestCol extract="yep" />;`,
      sourceFileName: pathTo('mock/validate.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv1.js).toEqual(
      `import "./validate.jsxstyle.css";
<Block extract="nope" />;
<div className="_x0" />;
<div className="_x1" />;
<Col extract="nope" />;
<InlineBlock extract="nope" />;
<div className="_x2" />;`
    );
  });

  it('puts spaces between each class name', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block className="orange" color={thing1 ? "orange" : "purple"} width={thing2 ? 200 : 400} />`,
      sourceFileName: pathTo('mock/classname-spaces.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `import "./classname-spaces.jsxstyle.css";
<div className={"orange " + ((thing1 ? "_x1" : "_x2") + (" " + (thing2 ? "_x3" : "_x4"))) + " _x0"} />;`
    );
  });
});

describe('element conversion', function() {
  it('converts jsxstyle elements to plain elements when all props are static', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
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
      sourceFileName: pathTo('mock/extract-static1.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./extract-static1.jsxstyle.css";
import LC from "./LC";
const val = "thing";
<div className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/extract-static1.js:4-11 (Block) */
._x0 {
  display: block;
  static-float: 6.9px;
  static-int: 69px;
  static-member-expression: ok;
  static-negative-int: -420px;
  static-string: wow;
  static-value: thing;
}
`
    );
  });

  it('converts jsxstyle elements to Block elements when some props aren\u2019t static', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
const val = "thing";
import LC from "./LC";
<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} dynamicValue={notStatic} />`,
      sourceFileName: pathTo('mock/extract-static2.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./extract-static2.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
const val = "thing";
import LC from "./LC";
<_Box dynamicValue={notStatic} className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/extract-static2.js:4 (Block) */
._x0 {
  display: block;
  static-int: 69px;
  static-member-expression: ok;
  static-string: wow;
  static-value: thing;
}
`
    );
  });
});

describe('spread operators', function() {
  it("doesn't explode if you use the spread operator", () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
const BlueBlock = ({wow, ...props}) => <Block color="blue" {...props} test="wow" />;
const DynamicBlock = ({wow, ...props}) => <Block dynamicProp={wow} {...props} />;`,
      sourceFileName: pathTo('mock/rest-spread.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `import "./rest-spread.jsxstyle.css";
import { Box as _Box } from "jsxstyle";

const BlueBlock = ({
  wow,
  ...props
}) => <_Box display="block" color="blue" {...props} test={null} className="_x0" />;

const DynamicBlock = ({
  wow,
  ...props
}) => <_Box display="block" dynamicProp={wow} {...props} />;`
    );
  });

  it('handles props mixed with spread operators', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block doNotExtract="no" {...spread} extract="yep" />`,
      sourceFileName: pathTo('mock/spread.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `import "./spread.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<_Box display="block" doNotExtract="no" {...spread} extract={null} className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/spread.js:2 (Block) */
._x0 {
  extract: yep;
}
`
    );
  });

  it('handles reserved props before the spread operators', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
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
      sourceFileName: pathTo('mock/spread.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `import "./spread.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<_Box display="block" component="wow" props={{
  test: 4
}} key={test} ref={test} style={{}} {...spread} color={null} className={(typeof spread === "object" && spread !== null && spread.className || wow || "") + " _x0"} />;`
    );
    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/spread.js:2-11 (Block) */
._x0 {
  color: red;
}
`
    );
  });

  it('extracts spreads from trusted sources', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
import LC from "./LC";
const staticSpread = {
  color: "#444",
  width: 420
};

function Thing(props) {
  return <Block width="100%" {...LC.containerStyles} {...staticSpread} />;
}
`,
      sourceFileName: pathTo('mock/trusted-spreads.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./trusted-spreads.jsxstyle.css";
import LC from "./LC";
const staticSpread = {
  color: "#444",
  width: 420
};

function Thing(props) {
  return <div className="_x0" />;
}`
    );

    expect(rv.css)
      .toEqual(`/* ./packages/jsxstyle-loader/tests/mock/trusted-spreads.js:9 (Block) */
._x0 {
  background-color: #FFF;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07);
  color: #444;
  display: block;
  width: 420px;
}
`);
  });
});

describe('cache object', function() {
  it('updates `cacheObject` counter and key object', () => {
    const cacheObject = {};

    extractStyles({
      src: `import {Block} from "jsxstyle"; <Block />`,
      sourceFileName: pathTo('mock/cache-object.js'),
      cacheObject,
    });

    extractStyles({
      src: `import {Block} from "jsxstyle"; <Block staticThing="wow" />`,
      sourceFileName: pathTo('mock/cache-object.js'),
      cacheObject,
    });

    extractStyles({
      src: `import {InlineBlock} from "jsxstyle"; <InlineBlock />`,
      sourceFileName: pathTo('mock/cache-object.js'),
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
});

describe('style groups', function() {
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
      src: `import {Block, InlineBlock} from "jsxstyle";
<Block>
  <Block thing="wow" hoverThing="ok" />
  <InlineBlock />
</Block>`,
      sourceFileName: pathTo('mock/style-groups.js'),
      cacheObject,
      styleGroups,
    });

    expect(rv.js).toEqual(
      `import "./style-groups.jsxstyle.css";
<div className="_x0">
  <div className="_x1 _x0" />
  <div className="_x2" />
</div>;`
    );

    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/style-groups.js:2 (Block) */
/* ./packages/jsxstyle-loader/tests/mock/style-groups.js:3 (Block) */
._x0 {
  display: block;
}
/* ./packages/jsxstyle-loader/tests/mock/style-groups.js:3 (Block) */
._x1 {
  thing: wow;
}
._x1:hover {
  thing: ok;
}
/* ./packages/jsxstyle-loader/tests/mock/style-groups.js:4 (InlineBlock) */
._x2 {
  display: inline-block;
}
`
    );
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
      src: `import {Block, InlineBlock} from "jsxstyle";
<Block>
  <Block thing="wow" hoverThing="ok" />
  <InlineBlock />
</Block>`,
      sourceFileName: pathTo('mock/named-style-groups.js'),
      cacheObject,
      namedStyleGroups,
    });

    expect(rv.js).toEqual(
      `import "./named-style-groups.jsxstyle.css";
<div className="_x0">
  <div className="_test1 _x0" />
  <div className="_test2" />
</div>;`
    );

    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/named-style-groups.js:2 (Block) */
/* ./packages/jsxstyle-loader/tests/mock/named-style-groups.js:3 (Block) */
._x0 {
  display: block;
}
/* ./packages/jsxstyle-loader/tests/mock/named-style-groups.js:3 (Block) */
._test1 {
  thing: wow;
}
._test1:hover {
  thing: ok;
}
/* ./packages/jsxstyle-loader/tests/mock/named-style-groups.js:4 (InlineBlock) */
._test2 {
  display: inline-block;
}
`
    );
  });
});

describe('jsxstyle-specific props', function() {
  it('handles the `props` prop correctly', () => {
    const errorCallback = jest.fn();

    const rv1 = extractStyles({
      src: `import {Block} from "jsxstyle";
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
      sourceFileName: pathTo('mock/props-prop1.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    expect(rv1.js).toEqual(
      `import "./props-prop1.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<div staticObject="yep" className="_x0" />;
<div className="_x0" />;
<div {...variable} className="_x0" />;
<div {...calledFunction()} className="_x0" />;
<div {...member.expression} className="_x0" />;
<div objectShorthand={objectShorthand} className="_x0" />;
<div {...one} two={{
  three,
  four: "five",
  ...six
}} className="_x1" />;
<div aria-hidden={true} className="_x0" />;
<_Box props={{
  className: "test"
}} className="_x0" />;
<_Box props={{
  style: "test"
}} className="_x0" />;
<_Box props="invalid" className="_x0" />;
<_Box dynamicProp={wow} props="invalid" className="_x0" />;
<_Box props={{
  "aria hidden": true
}} className="_x0" />;
<_Box props={{
  "-aria-hidden": true
}} className="_x0" />;`
    );

    expect(errorCallback).toHaveBeenCalledTimes(6);

    const rv2 = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block color="red" ref={r => this.testBlock = r} />`,
      sourceFileName: pathTo('mock/props-prop2.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv2.js).toEqual(
      `import "./props-prop2.jsxstyle.css";
<div ref={r => this.testBlock = r} className="_x0" />;`
    );
  });

  it('handles the `component` prop correctly', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block component="input" />;
<Block component={Thing} />;
<Block component={thing.cool} />;
<Block component="h1" {...spread} />;
<Block before="wow" component="h1" dynamic={wow} color="red" />;`,
      sourceFileName: pathTo('mock/component-prop1.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./component-prop1.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<input className="_x0" />;
<Thing className="_x0" />;
<thing.cool className="_x0" />;
<_Box display="block" component="h1" {...spread} />;
<_Box component="h1" dynamic={wow} className="_x1" />;`
    );

    const errorCallback = jest.fn();

    // does not warn
    extractStyles({
      src: `import {Block} from "jsxstyle";
<Block component="CapitalisedString" />`,
      sourceFileName: pathTo('mock/component-prop2.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    // does not warn
    extractStyles({
      src: `import {Block} from "jsxstyle";
<Block component={lowercaseIdentifier} />`,
      sourceFileName: pathTo('mock/component-prop3.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    extractStyles({
      src: `import {Block} from "jsxstyle";
<Block component={functionCall()} />`,
      sourceFileName: pathTo('mock/component-prop4.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    extractStyles({
      src: `import {Block} from "jsxstyle";
<Block component={member.expression()} />`,
      sourceFileName: pathTo('mock/component-prop4.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    expect(errorCallback).toHaveBeenCalledTimes(2);
  });

  it('handles the `className` prop correctly', () => {
    const rv1 = extractStyles({
      src: `import {Block, Row} from "jsxstyle";
<Row className={member.expression} {...spread} />;
<Block className="orange" />;`,
      sourceFileName: pathTo('mock/class-name1.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv1.js).toEqual(
      `import "./class-name1.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<_Box display="flex" flexDirection="row" className={member.expression} {...spread} />;
<div className="orange _x0" />;`
    );
  });

  it('handles the `mediaQueries` prop correctly', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block
  mediaQueries={{ sm: "only screen and (min-width: 640px)" }}
  width={640}
  smWidth="100%"
/>;`,
      sourceFileName: pathTo('mock/media-queries.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `import "./media-queries.jsxstyle.css";
<div className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/media-queries.js:2-6 (Block) */
._x0 {
  display: block;
  width: 640px;
}
@media only screen and (min-width: 640px) { ._x0 {
  width: 100%;
} }
`
    );
  });

  it('evaluates the `mediaQueries` prop correctly', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
import LC from "./LC";
<Block
  mediaQueries={LC.mediaQueries}
  width={640}
  smWidth="100%"
/>;`,
      sourceFileName: pathTo('mock/media-queries.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./media-queries.jsxstyle.css";
import LC from "./LC";
<div className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/media-queries.js:3-7 (Block) */
._x0 {
  display: block;
  width: 640px;
}
@media small media query { ._x0 {
  width: 100%;
} }
`
    );
  });
});

describe('ternaries', function() {
  it('extracts a ternary expression that has static consequent and alternate', () => {
    const rv = extractStyles({
      src: `import { Block } from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} />`,
      sourceFileName: pathTo('mock/ternary.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./ternary.jsxstyle.css";
<div className={(dynamic ? "_x1" : "_x2") + " _x0"} />;`
    );
  });

  it('extracts a conditional expression with a static right side and an AND operator', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block color={dynamic && "red"} />`,
      sourceFileName: pathTo('mock/ternary.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./ternary.jsxstyle.css";
<div className={(dynamic ? "_x1" : "") + " _x0"} />;`
    );

    expect(rv.css)
      .toEqual(`/* ./packages/jsxstyle-loader/tests/mock/ternary.js:2 (Block) */
._x0 {
  display: block;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary.js:2 (Block) */
._x1 {
  color: red;
}
`);
  });

  it.skip('extracts a conditional expression with a static right side and an OR operator', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block color={dynamic || "red"} />`,
      sourceFileName: pathTo('mock/ternary.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./ternary.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<_Box color={dynamic} className={(dynamic ? "" : "_x1") + " _x0"} />;`
    );

    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/ternary.js:2 (Block) */
._x0 {
  display: block;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary.js:2 (Block) */
._x1 {
  color: red;
}
`
    );
  });

  it('extracts a ternary expression that has a whitelisted consequent and alternate', () => {
    const rv = extractStyles({
      src: `import LC from "./LC";
import {Block} from "jsxstyle";
const blue = "blueberry";
<Block color={dynamic ? LC.red : blue} />`,
      sourceFileName: pathTo('mock/ternary.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./ternary.jsxstyle.css";
import LC from "./LC";
const blue = "blueberry";
<div className={(dynamic ? "_x1" : "_x2") + " _x0"} />;`
    );

    expect(rv.css)
      .toEqual(`/* ./packages/jsxstyle-loader/tests/mock/ternary.js:4 (Block) */
._x0 {
  display: block;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary.js:4 (Block) */
._x1 {
  color: strawberry;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary.js:4 (Block) */
._x2 {
  color: blueberry;
}
`);
  });

  it('extracts a ternary expression from a component that has a className specified', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block className="cool" color={dynamic ? "red" : "blue"} />`,
      sourceFileName: pathTo('mock/ternary-with-classname.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./ternary-with-classname.jsxstyle.css";
<div className={"cool " + (dynamic ? "_x1" : "_x2") + " _x0"} />;`
    );
  });

  it('extracts a ternary expression from a component that has a spread operator specified', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block {...spread} color={dynamic ? "red" : "blue"} />`,
      sourceFileName: pathTo('mock/ternary-with-spread.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/ternary-with-spread.js:2 (Block) */
._x0 {
  color: red;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary-with-spread.js:2 (Block) */
._x1 {
  color: blue;
}
`
    );

    expect(rv.js).toEqual(
      `import "./ternary-with-spread.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<_Box display="block" {...spread} color={null} className={dynamic ? "_x0" : "_x1"} />;`
    );
  });

  it.skip('positivizes negated identifiers', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block
  thing1={dynamic && "one"}
  thing2={!dynamic && "two"}
  thing3={dynamic ? "con" : "alt"}
  thing4={!dynamic ? "con" : "alt"}
/>`,
      sourceFileName: pathTo('mock/ternary-with-spread.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.css).toEqual(``);
  });

  it.skip('positivizes negated comparisons', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
  <Block
    thing1={dynamic === 4 && "one"}
    thing2={dynamic !== 4 && "two"}
  />`,
      sourceFileName: pathTo('mock/ternary-with-spread.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.css).toEqual(``);
  });

  it.skip('positivizes negated expressions', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
    <Block
      thing1={!(dynamic % 2) && "one"}
      thing2={dynamic % 2 && "two"}
    />`,
      sourceFileName: pathTo('mock/ternary-with-spread.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.css).toEqual(``);

    expect(rv.js).toEqual(
      `import "./ternary-with-spread.jsxstyle.css";
import { Box as _Box } from "jsxstyle";
<_Box display="block" {...spread} color={null} className={dynamic ? "_x0" : "_x1"} />;`
    );
  });

  it('ignores a ternary expression that comes before a spread operator', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} {...spread} className="cool" />`,
      sourceFileName: pathTo('mock/ternary-with-classname.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(`import { Box as _Box } from "jsxstyle";
<_Box display="block" color={dynamic ? "red" : "blue"} {...spread} className="cool" />;`);
  });

  it('groups extracted ternary statements', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block color={dynamic ? "red" : "blue"} width={dynamic ? 200 : 400} />`,
      sourceFileName: pathTo('mock/ternary-groups.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./ternary-groups.jsxstyle.css";
<div className={(dynamic ? "_x1" : "_x2") + " _x0"} />;`
    );

    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/ternary-groups.js:2 (Block) */
._x0 {
  display: block;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary-groups.js:2 (Block) */
._x1 {
  color: red;
  width: 200px;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary-groups.js:2 (Block) */
._x2 {
  color: blue;
  width: 400px;
}
`
    );
  });

  it('handles null values in ternaries correctly', () => {
    const rv = extractStyles({
      src: `import {Block} from "jsxstyle";
<Block color={dynamic ? null : "blue"} />`,
      sourceFileName: pathTo('mock/ternary-null-values.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `import "./ternary-null-values.jsxstyle.css";
<div className={(dynamic ? "" : "_x1") + " _x0"} />;`
    );

    expect(rv.css).toEqual(
      `/* ./packages/jsxstyle-loader/tests/mock/ternary-null-values.js:2 (Block) */
._x0 {
  display: block;
}
/* ./packages/jsxstyle-loader/tests/mock/ternary-null-values.js:2 (Block) */
._x1 {
  color: blue;
}
`
    );
  });
});

describe('experimental: jsxstyle lite', function() {
  const msg =
    'jsxstyle-loader encountered a dynamic prop (`%s`) on a lite ' +
    'jsxstyle component (`%s`). If you would like to pass dynamic ' +
    'styles to this component, specify them in the `style` prop.';

  it('is extremely lite (React)', () => {
    const errorCallback = jest.fn();

    const rv = extractStyles({
      src: `<block static="value" dynamic={value} />;
<inline-block color="blue" />;`,
      sourceFileName: pathTo('mock/jsxstyle-extremely-lite.js'),
      cacheObject: {},
      errorCallback,
      extremelyLiteMode: 'react',
    });

    expect(rv.js).toEqual(`require("./jsxstyle-extremely-lite.jsxstyle.css");

<div className="_x0" />;
<div className="_x1" />;`);

    expect(rv.css)
      .toEqual(`/* ./packages/jsxstyle-loader/tests/mock/jsxstyle-extremely-lite.js:1 (block) */
._x0 {
  display: block;
  static: value;
}
/* ./packages/jsxstyle-loader/tests/mock/jsxstyle-extremely-lite.js:2 (inline-block) */
._x1 {
  color: blue;
  display: inline-block;
}
`);
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(msg, 'dynamic={value}', 'block');
  });

  it('is extremely lite (Preact)', () => {
    const errorCallback = jest.fn();

    const rv = extractStyles({
      src: `<block static="value" dynamic={value} />;
<inline-block color="blue" />;`,
      sourceFileName: pathTo('mock/jsxstyle-extremely-lite-preact.js'),
      cacheObject: {},
      errorCallback,
      extremelyLiteMode: 'preact',
    });

    expect(rv.js)
      .toEqual(`require("./jsxstyle-extremely-lite-preact.jsxstyle.css");

<div class="_x0" />;
<div class="_x1" />;`);

    expect(rv.css)
      .toEqual(`/* ./packages/jsxstyle-loader/tests/mock/jsxstyle-extremely-lite-preact.js:1 (block) */
._x0 {
  display: block;
  static: value;
}
/* ./packages/jsxstyle-loader/tests/mock/jsxstyle-extremely-lite-preact.js:2 (inline-block) */
._x1 {
  color: blue;
  display: inline-block;
}
`);
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(msg, 'dynamic={value}', 'block');
  });
});

describe('edge cases', () => {
  it('only removes component imports', () => {
    const rv = extractStyles({
      src: `import 'jsxstyle';
import { cache, InvalidComponent, Row as RenamedRow } from 'jsxstyle';
import { Grid } from 'jsxstyle';
// should probably remove this as well
require('jsxstyle');
const { Box } = require('jsxstyle');
const { Block, Col: RenamedCol } = require('jsxstyle');
const { invalid, AlsoInvalid, InlineBlock } = require('jsxstyle');`,
      sourceFileName: pathTo('mock/edge-case1.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(`import { cache, InvalidComponent } from 'jsxstyle';

// should probably remove this as well
require('jsxstyle');

const {
  invalid,
  AlsoInvalid
} = require('jsxstyle');`);
  });
});
