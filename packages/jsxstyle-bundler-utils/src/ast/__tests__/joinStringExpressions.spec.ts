import { parse, generate } from '../babelUtils';
import * as t from '@babel/types';
import { joinStringExpressions } from '../joinStringExpressions';

describe('joinStringExpressions', () => {
  it('joins expressions', () => {
    const expressionAst = parse(`
// start with something that isn't a string since JS thinks initial strings are directives
1 + 1;
123;
'hello';
'';
null;
a ? 'b' : 'c';
undefined;
`);

    const expressions = expressionAst.program.body
      .filter(
        (item): item is t.ExpressionStatement =>
          item.type === 'ExpressionStatement'
      )
      .map((item) => item.expression);

    expect(
      generate(joinStringExpressions(...expressions)).code
    ).toMatchInlineSnapshot(
      `""hello " + 1 + 1 + " " + 123 + " " + (a ? 'b' : 'c')"`
    );
  });
});
