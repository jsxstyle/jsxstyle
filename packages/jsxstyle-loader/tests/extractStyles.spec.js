'use strict';

const path = require('path');

const extractStyles = require('../utils/ast/extractStyles');

const whitelistedModules = [require.resolve('./mock/LC')];

describe('the basics', function() {
  it('only extracts styles from valid jsxstyle components', () => {
    const rv1 = extractStyles({
      src: `import {Block as TestBlock} from 'jsxstyle';
const {Col: TestCol, Row} = require('jsxstyle');
<Block extract="nope" />;
<TestBlock extract="yep" />;
<Row extract="yep" />;
<Col extract="nope" />;
<InlineBlock extract="nope" />;
<TestCol extract="yep" />;`,
      sourceFileName: path.resolve(__dirname, 'mock/validate.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv1.js).toEqual(
      `require('./validate.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block as TestBlock } from 'jsxstyle';
const { Col: TestCol, Row } = require('jsxstyle');
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
      src: `import {Block} from 'jsxstyle';
<Block className="orange" color={thing1 ? 'orange' : 'purple'} width={thing2 ? 200 : 400} />`,
      sourceFileName: path.resolve(__dirname, 'mock/classname-spaces.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require('./classname-spaces.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div className={'orange ' + ((thing1 ? '_x1' : '_x2') + (' ' + (thing2 ? '_x3' : '_x4'))) + ' _x0'} />;`
    );
  });
});

describe('element conversion', function() {
  it('converts jsxstyle elements to plain elements when all props are static', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
import LC from './LC';
const val = 'thing';
<Block
  staticString="wow"
  staticInt={69}
  staticFloat={6.9}
  staticNegativeInt={-420}
  staticValue={val}
  staticMemberExpression={LC.staticValue}
/>`,
      sourceFileName: path.resolve(__dirname, 'mock/extract-static1.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./extract-static1.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
import LC from './LC';
const val = 'thing';
<div className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./tests/mock/extract-static1.js:4-11 (Block) */
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
      src: `import {Block} from 'jsxstyle';
const val = 'thing';
import LC from './LC';
<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} dynamicValue={notStatic} />`,
      sourceFileName: path.resolve(__dirname, 'mock/extract-static2.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./extract-static2.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
const val = 'thing';
import LC from './LC';
<Jsxstyle$Box dynamicValue={notStatic} className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./tests/mock/extract-static2.js:4 (Block) */
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
      src: `import {Block} from 'jsxstyle';
const BlueBlock = ({wow, ...props}) => <Block color="blue" {...props} test="wow" />;
const DynamicBlock = ({wow, ...props}) => <Block dynamicProp={wow} {...props} />;`,
      sourceFileName: path.resolve(__dirname, 'mock/rest-spread.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require('./rest-spread.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
const BlueBlock = ({ wow, ...props }) => <Jsxstyle$Box display="block" color="blue" {...props} test={null} className="_x0" />;
const DynamicBlock = ({ wow, ...props }) => <Jsxstyle$Box display="block" dynamicProp={wow} {...props} />;`
    );
  });

  it('handles props mixed with spread operators', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block doNotExtract="no" {...spread} extract="yep" />`,
      sourceFileName: path.resolve(__dirname, 'mock/spread.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require('./spread.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<Jsxstyle$Box display="block" doNotExtract="no" {...spread} extract={null} className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./tests/mock/spread.js:2 (Block) */
._x0 {
  extract: yep;
}
`
    );
  });

  it('handles reserved props before the spread operators', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
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
      sourceFileName: path.resolve(__dirname, 'mock/spread.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require('./spread.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<Jsxstyle$Box display="block" component="wow" props={{ test: 4 }} key={test} ref={test} style={{}} {...spread} color={null} className={(typeof spread === 'object' && spread !== null && spread.className || wow || '') + ' _x0'} />;`
    );
    expect(rv.css).toEqual(
      `/* ./tests/mock/spread.js:2-11 (Block) */
._x0 {
  color: red;
}
`
    );
  });

  it('extracts spreads from trusted sources', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
import LC from './LC';
const staticSpread = {color: '#444', width: 420};

function Thing(props) {
  return <Block width="100%" {...LC.containerStyles} {...staticSpread} />;
}
`,
      sourceFileName: path.resolve(__dirname, 'mock/trusted-spreads.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./trusted-spreads.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
import LC from './LC';
const staticSpread = { color: '#444', width: 420 };

function Thing(props) {
  return <div className="_x0" />;
}`
    );

    expect(rv.css).toEqual(`/* ./tests/mock/trusted-spreads.js:6 (Block) */
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
      src: `import {Block} from 'jsxstyle';
<Block />`,
      sourceFileName: path.resolve(__dirname, 'mock/cache-object.js'),
      cacheObject,
    });

    extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block staticThing="wow" />`,
      sourceFileName: path.resolve(__dirname, 'mock/cache-object.js'),
      cacheObject,
    });

    extractStyles({
      src: `import {InlineBlock} from 'jsxstyle';
<InlineBlock />`,
      sourceFileName: path.resolve(__dirname, 'mock/cache-object.js'),
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
      src: `import {Block, InlineBlock} from 'jsxstyle';
<Block>
  <Block thing="wow" hoverThing="ok" />
  <InlineBlock />
</Block>`,
      sourceFileName: path.resolve(__dirname, 'mock/style-groups.js'),
      cacheObject,
      styleGroups,
    });

    expect(rv.js).toEqual(
      `require('./style-groups.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block, InlineBlock } from 'jsxstyle';
<div className="_x0">
  <div className="_x1 _x0" />
  <div className="_x2" />
</div>;`
    );

    expect(rv.css).toEqual(
      `/* ./tests/mock/style-groups.js:2 (Block) */
/* ./tests/mock/style-groups.js:3 (Block) */
._x0 {
  display: block;
}
/* ./tests/mock/style-groups.js:3 (Block) */
._x1 {
  thing: wow;
}
._x1:hover {
  thing: ok;
}
/* ./tests/mock/style-groups.js:4 (InlineBlock) */
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
      src: `import {Block, InlineBlock} from 'jsxstyle';
<Block>
  <Block thing="wow" hoverThing="ok" />
  <InlineBlock />
</Block>`,
      sourceFileName: path.resolve(__dirname, 'mock/named-style-groups.js'),
      cacheObject,
      namedStyleGroups,
    });

    expect(rv.js).toEqual(
      `require('./named-style-groups.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block, InlineBlock } from 'jsxstyle';
<div className="_x0">
  <div className="_test1 _x0" />
  <div className="_test2" />
</div>;`
    );

    expect(rv.css).toEqual(
      `/* ./tests/mock/named-style-groups.js:2 (Block) */
/* ./tests/mock/named-style-groups.js:3 (Block) */
._x0 {
  display: block;
}
/* ./tests/mock/named-style-groups.js:3 (Block) */
._test1 {
  thing: wow;
}
._test1:hover {
  thing: ok;
}
/* ./tests/mock/named-style-groups.js:4 (InlineBlock) */
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
      src: `import {Block} from 'jsxstyle';
<Block props={{staticObject: 'yep'}} />;
<Block props={{}} />;
<Block props={variable} />;
<Block props={calledFunction()} />;
<Block props={member.expression} />;
<Block props={{objectShorthand}} />;
<Block props={{...one, two: {three, four: 'five', ...six}}} seven="eight" />;
<Block props={{ 'aria-hidden': true }} />;
<Block props={{className: 'test'}} />;
<Block props={{style: 'test'}} />;
<Block props="invalid" />;
<Block dynamicProp={wow} props="invalid" />;
<Block props={{ 'aria hidden': true }} />;
<Block props={{ '-aria-hidden': true }} />;`,
      sourceFileName: path.resolve(__dirname, 'mock/props-prop1.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    expect(rv1.js).toEqual(
      `require('./props-prop1.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div staticObject="yep" className="_x0" />;
<div className="_x0" />;
<div {...variable} className="_x0" />;
<div {...calledFunction()} className="_x0" />;
<div {...member.expression} className="_x0" />;
<div objectShorthand={objectShorthand} className="_x0" />;
<div {...one} two={{ three, four: 'five', ...six }} className="_x1" />;
<div aria-hidden={true} className="_x0" />;
<Jsxstyle$Box props={{ className: 'test' }} className="_x0" />;
<Jsxstyle$Box props={{ style: 'test' }} className="_x0" />;
<Jsxstyle$Box props="invalid" className="_x0" />;
<Jsxstyle$Box dynamicProp={wow} props="invalid" className="_x0" />;
<Jsxstyle$Box props={{ 'aria hidden': true }} className="_x0" />;
<Jsxstyle$Box props={{ '-aria-hidden': true }} className="_x0" />;`
    );

    expect(errorCallback).toHaveBeenCalledTimes(6);

    const rv2 = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block color="red" ref={r => this.testBlock = r} />`,
      sourceFileName: path.resolve(__dirname, 'mock/props-prop2.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv2.js).toEqual(
      `require('./props-prop2.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div ref={r => this.testBlock = r} className="_x0" />;`
    );
  });

  it('handles the `component` prop correctly', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block component="input" />;
<Block component={Thing} />;
<Block component={thing.cool} />;
<Block component="h1" {...spread} />;
<Block before="wow" component="h1" dynamic={wow} color="red" />;`,
      sourceFileName: path.resolve(__dirname, 'mock/component-prop1.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./component-prop1.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<input className="_x0" />;
<Thing className="_x0" />;
<thing.cool className="_x0" />;
<Jsxstyle$Box display="block" component="h1" {...spread} />;
<Jsxstyle$Box component="h1" dynamic={wow} className="_x1" />;`
    );

    const errorCallback = jest.fn();

    // does not warn
    extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block component="CapitalisedString" />`,
      sourceFileName: path.resolve(__dirname, 'mock/component-prop2.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    // does not warn
    extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block component={lowercaseIdentifier} />`,
      sourceFileName: path.resolve(__dirname, 'mock/component-prop3.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block component={functionCall()} />`,
      sourceFileName: path.resolve(__dirname, 'mock/component-prop4.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block component={member.expression()} />`,
      sourceFileName: path.resolve(__dirname, 'mock/component-prop4.js'),
      cacheObject: {},
      whitelistedModules,
      errorCallback,
    });

    expect(errorCallback).toHaveBeenCalledTimes(2);
  });

  it('handles the `className` prop correctly', () => {
    const rv1 = extractStyles({
      src: `import {Block, Row} from 'jsxstyle';
<Row className={member.expression} {...spread} />;
<Block className="orange" />;`,
      sourceFileName: path.resolve(__dirname, 'mock/class-name1.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv1.js).toEqual(
      `require('./class-name1.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block, Row } from 'jsxstyle';
<Jsxstyle$Box display="flex" flexDirection="row" className={member.expression} {...spread} />;
<div className="orange _x0" />;`
    );
  });

  it('handles the `mediaQueries` prop correctly', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block
  mediaQueries={{ sm: 'only screen and (min-width: 640px)' }}
  width={640}
  smWidth="100%"
/>;`,
      sourceFileName: path.resolve(__dirname, 'mock/media-queries.js'),
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require('./media-queries.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./tests/mock/media-queries.js:2-6 (Block) */
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
      src: `import {Block} from 'jsxstyle';
import LC from './LC';
<Block
  mediaQueries={LC.mediaQueries}
  width={640}
  smWidth="100%"
/>;`,
      sourceFileName: path.resolve(__dirname, 'mock/media-queries.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./media-queries.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
import LC from './LC';
<div className="_x0" />;`
    );
    expect(rv.css).toEqual(
      `/* ./tests/mock/media-queries.js:3-7 (Block) */
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
      src: `import { Block } from 'jsxstyle';
<Block color={dynamic ? 'red' : 'blue'} />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./ternary.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div className={(dynamic ? '_x1' : '_x2') + ' _x0'} />;`
    );
  });

  it('extracts a simple conditional expression that has static right side', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block color={dynamic && 'red'} />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./ternary.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div className={(dynamic ? '_x1' : '') + ' _x0'} />;`
    );

    expect(rv.css).toEqual(`/* ./tests/mock/ternary.js:2 (Block) */
._x0 {
  display: block;
}
/* ./tests/mock/ternary.js:2 (Block) */
._x1 {
  color: red;
}
`);
  });

  it('extracts a ternary expression that has a whitelisted consequent and alternate', () => {
    const rv = extractStyles({
      src: `import LC from './LC';
import {Block} from 'jsxstyle';
const blue = 'blueberry';
<Block color={dynamic ? LC.red : blue} />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./ternary.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import LC from './LC';
import { Block } from 'jsxstyle';
const blue = 'blueberry';
<div className={(dynamic ? '_x1' : '_x2') + ' _x0'} />;`
    );

    expect(rv.css).toEqual(`/* ./tests/mock/ternary.js:4 (Block) */
._x0 {
  display: block;
}
/* ./tests/mock/ternary.js:4 (Block) */
._x1 {
  color: strawberry;
}
/* ./tests/mock/ternary.js:4 (Block) */
._x2 {
  color: blueberry;
}
`);
  });

  it('extracts a ternary expression from a component that has a className specified', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block className="cool" color={dynamic ? 'red' : 'blue'} />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary-with-classname.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./ternary-with-classname.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div className={'cool ' + (dynamic ? '_x1' : '_x2') + ' _x0'} />;`
    );
  });

  it('extracts a ternary expression from a component that has a className and spread operator', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block {...spread} color={dynamic ? 'red' : 'blue'} />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary-with-spread.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.css).toEqual(
      `/* ./tests/mock/ternary-with-spread.js:2 (Block) */
._x0 {
  color: red;
}
/* ./tests/mock/ternary-with-spread.js:2 (Block) */
._x1 {
  color: blue;
}
`
    );

    expect(rv.js).toEqual(
      `require('./ternary-with-spread.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<Jsxstyle$Box display="block" {...spread} color={null} className={dynamic ? '_x0' : '_x1'} />;`
    );
  });

  it('ignores a ternary expression that comes before a spread operator', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block color={dynamic ? 'red' : 'blue'} {...spread} className="cool" />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary-with-classname.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(`var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<Jsxstyle$Box display="block" color={dynamic ? 'red' : 'blue'} {...spread} className="cool" />;`);
  });

  it('groups extracted ternary statements', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block color={dynamic ? 'red' : 'blue'} width={dynamic ? 200 : 400} />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary-groups.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./ternary-groups.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div className={(dynamic ? '_x1' : '_x2') + ' _x0'} />;`
    );

    expect(rv.css).toEqual(
      `/* ./tests/mock/ternary-groups.js:2 (Block) */
._x0 {
  display: block;
}
/* ./tests/mock/ternary-groups.js:2 (Block) */
._x1 {
  color: red;
  width: 200px;
}
/* ./tests/mock/ternary-groups.js:2 (Block) */
._x2 {
  color: blue;
  width: 400px;
}
`
    );
  });

  it('handles null values in ternaries correctly', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block color={dynamic ? null : 'blue'} />`,
      sourceFileName: path.resolve(__dirname, 'mock/ternary-null-values.js'),
      cacheObject: {},
      whitelistedModules,
    });

    expect(rv.js).toEqual(
      `require('./ternary-null-values.jsxstyle.css');

var Jsxstyle$Box = require('jsxstyle').Box;

import { Block } from 'jsxstyle';
<div className={(dynamic ? '' : '_x1') + ' _x0'} />;`
    );

    expect(rv.css).toEqual(
      `/* ./tests/mock/ternary-null-values.js:2 (Block) */
._x0 {
  display: block;
}
/* ./tests/mock/ternary-null-values.js:2 (Block) */
._x1 {
  color: blue;
}
`
    );
  });
});

describe('experimental: relative URL rewriting', function() {
  const resultCSS = `/* ./tests/mock/relative-urls.js:2 (Block) */
._x0 {
  b: url("./mock/path/to/file.png");
  display: block;
}
`;

  it('ignores invalid URLs', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block a="url(https://google.com)" b="url(/absolute/url)" c="url(data:uri)" />`,
      sourceFileName: path.resolve(__dirname, 'mock/relative-urls.js'),
      rootFileName: path.resolve(__dirname, 'thing.js'),
      addCSSRequire: false,
      cacheObject: {},
    });

    expect(rv.css).toEqual(`/* ./tests/mock/relative-urls.js:2 (Block) */
._x0 {
  a: url(https://google.com);
  b: url(/absolute/url);
  c: url(data:uri);
  display: block;
}
`);
  });

  it('rewrites relative URLs without dots', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block b="url(path/to/file.png)" />`,
      sourceFileName: path.resolve(__dirname, 'mock/relative-urls.js'),
      rootFileName: path.resolve(__dirname, 'thing.js'),
      addCSSRequire: false,
      cacheObject: {},
    });

    expect(rv.css).toEqual(resultCSS);
  });

  it('rewrites relative URLs with dots', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block b="url(./path/to/file.png)" />`,
      sourceFileName: path.resolve(__dirname, 'mock/relative-urls.js'),
      rootFileName: path.resolve(__dirname, 'thing.js'),
      addCSSRequire: false,
      cacheObject: {},
    });

    expect(rv.css).toEqual(resultCSS);
  });

  it('rewrites relative URLs with quotes', () => {
    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle';
<Block b="url('./path/to/file.png')" />`,
      sourceFileName: path.resolve(__dirname, 'mock/relative-urls.js'),
      rootFileName: path.resolve(__dirname, 'thing.js'),
      addCSSRequire: false,
      cacheObject: {},
    });

    expect(rv.css).toEqual(resultCSS);
  });
});

describe('experimental: jsxstyle/lite', function() {
  const msg =
    'jsxstyle-loader encountered a dynamic prop (`%s`) on a jsxstyle ' +
    'component that was imported from `%s`. If you would like to pass ' +
    'dynamic styles to this component, specify them in the `style` prop.';

  it('leaves no trace (React)', () => {
    const errorCallback = jest.fn();

    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle/lite';
import thing from 'jsxstyle/lib/thing';
<Block static="value" dynamic={value} />`,
      sourceFileName: path.resolve(__dirname, 'mock/jsxstyle-lite.js'),
      cacheObject: {},
      errorCallback,
    });

    expect(rv.js).toEqual(`require('./jsxstyle-lite.jsxstyle.css');

import thing from 'jsxstyle/lib/thing';
<div className="_x0" />;`);

    expect(rv.css).toEqual(`/* ./tests/mock/jsxstyle-lite.js:3 (Block) */
._x0 {
  display: block;
  static: value;
}
`);
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(
      msg,
      'dynamic={value}',
      'jsxstyle/lite'
    );
  });

  it('leaves no trace (Preact)', () => {
    const errorCallback = jest.fn();

    const rv = extractStyles({
      src: `import {Block} from 'jsxstyle/lite/preact';
import thing from 'jsxstyle/lib/thing';
<Block static="value" dynamic={value} />`,
      sourceFileName: path.resolve(__dirname, 'mock/jsxstyle-lite-preact.js'),
      cacheObject: {},
      errorCallback,
    });

    expect(rv.js).toEqual(`require('./jsxstyle-lite-preact.jsxstyle.css');

import thing from 'jsxstyle/lib/thing';
<div class="_x0" />;`);

    expect(rv.css).toEqual(`/* ./tests/mock/jsxstyle-lite-preact.js:3 (Block) */
._x0 {
  display: block;
  static: value;
}
`);
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(
      msg,
      'dynamic={value}',
      'jsxstyle/lite/preact'
    );
  });

  it('is extremely lite (React)', () => {
    const errorCallback = jest.fn();

    const rv = extractStyles({
      src: `import thing from 'jsxstyle/lib/thing';
<block static="value" dynamic={value} />;
<inline-block color="blue" />;`,
      sourceFileName: path.resolve(
        __dirname,
        'mock/jsxstyle-extremely-lite.js'
      ),
      cacheObject: {},
      errorCallback,
      extremelyLiteMode: 'react',
    });

    expect(rv.js).toEqual(`require('./jsxstyle-extremely-lite.jsxstyle.css');

import thing from 'jsxstyle/lib/thing';
<div className="_x0" />;
<div className="_x1" />;`);

    expect(rv.css)
      .toEqual(`/* ./tests/mock/jsxstyle-extremely-lite.js:2 (block) */
._x0 {
  display: block;
  static: value;
}
/* ./tests/mock/jsxstyle-extremely-lite.js:3 (inline-block) */
._x1 {
  color: blue;
  display: inline-block;
}
`);
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(
      msg,
      'dynamic={value}',
      'jsxstyle/lite'
    );
  });

  it('is extremely lite (Preact)', () => {
    const errorCallback = jest.fn();

    const rv = extractStyles({
      src: `import thing from 'jsxstyle/lib/thing';
<block static="value" dynamic={value} />;
<inline-block color="blue" />;`,
      sourceFileName: path.resolve(
        __dirname,
        'mock/jsxstyle-extremely-lite-preact.js'
      ),
      cacheObject: {},
      errorCallback,
      extremelyLiteMode: 'preact',
    });

    expect(rv.js)
      .toEqual(`require('./jsxstyle-extremely-lite-preact.jsxstyle.css');

import thing from 'jsxstyle/lib/thing';
<div class="_x0" />;
<div class="_x1" />;`);

    expect(rv.css)
      .toEqual(`/* ./tests/mock/jsxstyle-extremely-lite-preact.js:2 (block) */
._x0 {
  display: block;
  static: value;
}
/* ./tests/mock/jsxstyle-extremely-lite-preact.js:3 (inline-block) */
._x1 {
  color: blue;
  display: inline-block;
}
`);
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(
      msg,
      'dynamic={value}',
      'jsxstyle/lite/preact'
    );
  });
});
