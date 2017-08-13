'use strict';

const canEvaluate = require('../src/ast-utils/canEvaluate');
const parse = require('../src/ast-utils/parse');

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

describe('canEvaluate', () => {
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
      if (canEvaluate(staticNamespace, attr.value)) {
        errors.push(`'${attr.name.name}' should not be evaluated`);
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
      if (!canEvaluate(staticNamespace, attr.value.expression)) {
        errors.push(`'${attr.name.name}' should be evaluated`);
      }
    });

    expect(errors).toEqual([]);
  });
});
