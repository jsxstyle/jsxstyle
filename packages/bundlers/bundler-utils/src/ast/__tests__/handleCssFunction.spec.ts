import type * as t from '@babel/types';
import { createClassNameGetter } from '@jsxstyle/core';
import type { InsertRuleCallback } from '@jsxstyle/core';
import { format } from 'prettier';
import { generate, parse, traverse } from '../babelUtils';
import { getEvaluateAstNodeWithScopeFunction } from '../getEvaluateAstNodeWithScopeFunction';
import { handleCssFunction } from '../handleCssFunction';

const generateAndFormat = (node: t.Node) => {
  return format(generate(node).code, {
    parser: 'babel',
    printWidth: 80,
  });
};

describe('handleCssFunction', () => {
  it('works', async () => {
    const ast = parse(`
const wow = { spreadProp: 'spreadValue' };

const classNameString = css({
  conditionalProp: condition ? 'c' : 'a',
  logicalProp: !condition && 'tasty',
  anotherLogicalProp: condition && 'yes',
  mqThing1: mq && 123,
  mqThing2: mq ? 345 : 678,
  ...wow,
  normalProp: 'propValue',
});

const classNameString2 = css('class2', {
  dynamicProp: someValue * 2,
  staticProp: 123,
  '@media test': {
    color: 'red',
  },
  '& banana': {
    color: 'blue'
  },
}, 'class1');
`);

    const getClassNameForKey = createClassNameGetter({});
    let styles = '\n';
    const insertRuleCallback: InsertRuleCallback = (rule) => {
      styles += rule + '\n';
    };

    traverse(ast, {
      CallExpression(nodePath) {
        const output = handleCssFunction(nodePath.node, {
          attemptEval: getEvaluateAstNodeWithScopeFunction(
            nodePath,
            undefined,
            'test.js',
            {}
          ),
          classPropName: 'className',
          mediaQueriesByKey: { mq: 'example mq' },
          getClassNameForKey,
          onInsertRule: insertRuleCallback,
          logError: console.error,
          logWarning: console.warn,
          noRuntime: false,
        });

        nodePath.replaceWith(output);
        nodePath.skip();
      },
    });

    expect(await generateAndFormat(ast)).toMatchInlineSnapshot(`
      "const wow = {
        spreadProp: "spreadValue",
      };
      const classNameString =
        "_x0 _x1 _x2 _x3 _x4 " + (condition ? "_x5 _x6" : "_x7 _x8");
      const classNameString2 =
        "_x9 _xa _xb class1 class2 " +
        css({
          dynamicProp: someValue * 2,
        });
      "
    `);

    expect(styles).toMatchInlineSnapshot(`
      "
      @media example mq{._x0._x0._x0{mq-thing1:123px}}
      @media example mq{._x1._x1._x1{mq-thing2:345px}}
      ._x2{mq-thing2:678px}
      ._x3{spread-prop:spreadValue}
      ._x4{normal-prop:propValue}
      ._x5{conditional-prop:c}
      ._x6{another-logical-prop:yes}
      ._x7{conditional-prop:a}
      ._x8{logical-prop:tasty}
      ._x9{static-prop:123px}
      @media test{._xa._xa._xa{color:red}}
      ._xb banana{color:blue}
      "
    `);
  });
});
