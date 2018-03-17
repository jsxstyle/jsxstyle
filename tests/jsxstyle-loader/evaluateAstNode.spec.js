'use strict';

const evaluateAstNode = require('jsxstyle-loader/utils/ast/evaluateAstNode');
const parse = require('jsxstyle-loader/utils/ast/parse');
const vm = require('vm');
const generate = require('@babel/generator').default;

const staticNamespace = {
  LC: {
    thing1: 'wow',
    thing2: 'ok',
    thing3: 'cool',
  },
  nestedThing: {
    level1: {
      level2: 'level3',
    },
  },
  staticValue: 69,
  staticKey: 'thing3',
};

const ctx = vm.createContext(staticNamespace);
const evalFn = n => vm.runInContext('(' + generate(n).code + ')', ctx);

describe('evaluateAstNode', () => {
  it('does not evaluate dynamic props', () => {
    const ast = parse(
      `<Block
  dynamicValue={dynamicValue}
  dynamicComputedProperty={LC[dynamicValue].thing}
  templateString={\`thing\${one}\`}
  complexExpression={thing ? 69 : 420}
  binaryExpression={a + 'b'}
/>`
    );

    const errors = [];
    ast.program.body[0].expression.openingElement.attributes.forEach(attr => {
      try {
        evaluateAstNode(attr.value, evalFn);
        errors.push(`'${attr.name.name}' should not be evaluated`);
      } catch (e) {
        //
      }
    });
    expect(errors).toEqual([]);
  });

  it('evaluates static props', () => {
    const ast = parse(
      `<Block
  staticValue={staticValue}
  memberExpression={LC.thing1}
  computedProperty1={LC['thing2']}
  computedProperty2={LC[staticKey]}
  computedProperty3={LC['thing' + 1]}
  computedProperty4={LC[\`thing\${2}\`]}
  binaryExpression={staticValue + 420 + 'wow'}
  kitchenSink={nestedThing.level1['level2'][staticValue]}
/>`
    );

    const errors = [];
    ast.program.body[0].expression.openingElement.attributes.forEach(attr => {
      try {
        evaluateAstNode(attr.value.expression, evalFn);
      } catch (e) {
        errors.push(`'${attr.name.name}' should be evaluated`);
      }
    });

    expect(errors).toEqual([]);
  });

  it('only evaluates the weird shit', () => {
    const ast = parse(
      `<Block
  staticValue={staticValue}
  memberExpression={LC.thing1}
  computedProperty1={LC['thing2']}
  computedProperty2={LC[staticKey]}
  computedProperty3={LC['thing' + 1]}
  computedProperty4={LC[\`thing\${2}\`]}
  binaryExpression={staticValue + 420 + 'wow'}
  kitchenSink={nestedThing.level1['level2'][staticValue]}
/>`
    );

    const jestFn = jest.fn();
    const cb = n => {
      jestFn(n);
      return n;
    };

    const errors = [];
    ast.program.body[0].expression.openingElement.attributes.forEach(attr => {
      try {
        evaluateAstNode(attr.value.expression, cb);
      } catch (e) {
        errors.push(`'${attr.name.name}' should be evaluated`);
      }
    });

    expect(errors).toEqual([]);
  });
});
