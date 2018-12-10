import path = require('path');

import { extractStyles } from '../../packages/jsxstyle-webpack-plugin/lib/utils/ast/extractStyles';

const whitelistedModules = [require.resolve('./mock/LC')];

const pathTo = thing => path.resolve(__dirname, thing);

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
      { cacheObject: {} }
    );

    expect(rv1.js).toMatchSnapshot();
  });

  it('puts spaces between each class name', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block className="orange" color={thing1 ? "orange" : "purple"} width={thing2 ? 200 : 400} />`,
      pathTo('mock/classname-spaces.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchSnapshot();
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
      { cacheObject: {} },
      { whitelistedModules }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });

  it('converts jsxstyle elements to Block elements when some props aren\u2019t static', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
const val = "thing";
import LC from "./LC";
<Block staticString="wow" staticInt={69} staticValue={val} staticMemberExpression={LC.staticValue} dynamicValue={notStatic} />`,
      pathTo('mock/extract-static2.js'),
      { cacheObject: {} },
      { whitelistedModules }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
  });

  it('handles props mixed with spread operators', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block doNotExtract="no" {...spread} extract="yep" />`,
      pathTo('mock/spread.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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
      { cacheObject: {} },
      { whitelistedModules }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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

describe('style groups', () => {
  it('groups styles when a `styleGroups` array is provided', () => {
    const styleGroups = [
      {
        hoverThing: 'ok',
        thing: 'wow',
      },
      {
        display: 'inline-block',
      },
    ];

    const rv = extractStyles(
      `import {Block, InlineBlock} from "jsxstyle";
<Block>
  <Block thing="wow" hoverThing="ok" />
  <InlineBlock />
</Block>`,
      pathTo('mock/style-groups.js'),
      { cacheObject: {} },
      { styleGroups }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });

  it('groups styles when a `namedStyleGroups` object is provided', () => {
    const namedStyleGroups = {
      _test1: {
        hoverThing: 'ok',
        thing: 'wow',
      },
      _test2: {
        display: 'inline-block',
      },
    };

    const rv = extractStyles(
      `import {Block, InlineBlock} from "jsxstyle";
<Block>
  <Block thing="wow" hoverThing="ok" />
  <InlineBlock />
</Block>`,
      pathTo('mock/named-style-groups.js'),
      { cacheObject: {} },
      { namedStyleGroups }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();

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
    expect(rv.js).toMatchSnapshot();
  });

  it('handles the `className` prop correctly', () => {
    const rv1 = extractStyles(
      `import {Block, Row} from "jsxstyle";
<Row className={member.expression} {...spread} />;
<Block className="orange" />;`,
      pathTo('mock/class-name1.js'),
      { cacheObject: {} }
    );

    expect(rv1.js).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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
      { cacheObject: {} },
      { whitelistedModules }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
  });

  it('extracts a conditional expression with a static right side and an AND operator', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic && "red"} />`,
      pathTo('mock/ternary.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });

  it.skip('extracts a conditional expression with a static right side and an OR operator', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic || "red"} />`,
      pathTo('mock/ternary.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });

  it('extracts a ternary expression that has a whitelisted consequent and alternate', () => {
    const rv = extractStyles(
      `import LC from "./LC";
import {Block} from "jsxstyle";
const blue = "blueberry";
<Block color={dynamic ? LC.red : blue} />`,
      pathTo('mock/ternary.js'),
      { cacheObject: {} },
      { whitelistedModules }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });

  it('extracts a ternary expression from a component that has a className specified', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block className="cool" color={dynamic ? "red" : "blue"} />`,
      pathTo('mock/ternary-with-classname.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchSnapshot();
  });

  it('extracts a ternary expression from a component that has a spread operator specified', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block {...spread} color={dynamic ? "red" : "blue"} />`,
      pathTo('mock/ternary-with-spread.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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

    expect(rv1.js).toMatchSnapshot();
    expect(rv2.js).toMatchSnapshot();
    expect(rv1.css).toEqual(rv2.css);
    expect(rv1.css).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });

  it('handles null values in ternaries correctly', () => {
    const rv = extractStyles(
      `import {Block} from "jsxstyle";
<Block color={dynamic ? null : "blue"} />`,
      pathTo('mock/ternary-null-values.js'),
      { cacheObject: {} }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });
});

describe('experimental: jsxstyle lite', () => {
  const srcJS = `<block static="value" dynamic={value} />;
<inline-block color="blue" />;
<box />;
<row />;
<col flexGrow={1} />;`;

  it('converts lite mode elements to jsxstyle components (React)', () => {
    const rv = extractStyles(
      srcJS,
      pathTo('mock/lite-mode.js'),
      { cacheObject: {} },
      { liteMode: 'react' }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
  });

  it('converts lite mode elements to jsxstyle components (Preact)', () => {
    const rv = extractStyles(
      srcJS,
      pathTo('mock/lite-mode.js'),
      { cacheObject: {} },
      { liteMode: 'preact' }
    );

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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
    expect(rv.js).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
    expect(rv.css).toMatchSnapshot();
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
export const Thing: React.SFC<ThingProps> = props => <Block />;
ReactDOM.render(<Thing />, (document.getElementById('root') as HTMLElement));`;

    const tsResults = extractStyles(src, pathTo('mock/typescript.ts'), {
      cacheObject: {},
    });

    const tsxResults = extractStyles(src, pathTo('mock/typescript.tsx'), {
      cacheObject: {},
    });

    expect(tsResults.js).toEqual(tsxResults.js);
    expect(tsResults.js).toMatchSnapshot();
    expect(tsxResults.js).toMatchSnapshot();
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
    expect(evalVars.js).toMatchSnapshot();
    expect(noEvalVars.js).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
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

    expect(rv.js).toMatchSnapshot();
  });
});
