import * as t from '@babel/types';
import { generate, parse } from '../babelUtils';
import { normalizeTernary } from '../normalizeTernary';

describe('normalizeTernary', () => {
  it('works', () => {
    const ast = parse(`
    condition1 ? 'c1' : 'a1';
    !condition2 ? 'a2' : 'c2';
    !!condition3 ? 'c3' : 'a3';
    condition4 && 'c4';
    !condition5 && 'a5';
    !!condition6 && 'c6'
`);

    const ternaries = ast.program.body
      .map((item) => {
        return item.type === 'ExpressionStatement' ? item.expression : item;
      })
      .filter((node): node is t.ConditionalExpression | t.LogicalExpression => {
        return (
          node.type === 'ConditionalExpression' ||
          node.type === 'LogicalExpression'
        );
      });

    expect(
      ternaries.map((item) => {
        const result = normalizeTernary(item);
        return (
          generate(result.test).code +
          ' ? ' +
          generate(result.alternate).code +
          ' : ' +
          generate(result.consequent).code
        );
      })
    ).toMatchInlineSnapshot(`
      [
        "condition1 ? 'a1' : 'c1'",
        "condition2 ? 'a2' : 'c2'",
        "condition3 ? 'a3' : 'c3'",
        "condition4 ? null : 'c4'",
        "condition5 ? 'a5' : null",
        "condition6 ? null : 'c6'",
      ]
    `);
  });
});
