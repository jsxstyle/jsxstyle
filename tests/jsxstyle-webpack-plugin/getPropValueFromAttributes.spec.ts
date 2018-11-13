import generate from '@babel/generator';
import t = require('@babel/types');

import getPropValueFromAttributes from '../../packages/jsxstyle-webpack-plugin/lib/utils/ast/getPropValueFromAttributes';
import parse from '../../packages/jsxstyle-webpack-plugin/lib/utils/ast/parse';

describe('getPropValueFromAttributes', () => {
  it('returns the original prop value if no spread attributes appear before the requested prop', () => {
    // TODO: update to use `resolves` when Jest 20 is released
    const ast = parse(`<Block {...spread} thing={Wow} />`);
    const statement = ast.program.body[0] as t.ExpressionStatement;
    const jsxElement = statement.expression as t.JSXElement;
    const node = jsxElement.openingElement;
    const componentPropValue = getPropValueFromAttributes(
      'thing',
      node.attributes
    );
    expect(generate(componentPropValue).code).toEqual('Wow');
  });

  it('handles one spread operator', () => {
    const ast = parse(`<Block thing={Wow} {...spread} />;`);
    const statement = ast.program.body[0] as t.ExpressionStatement;
    const jsxElement = statement.expression as t.JSXElement;
    const node = jsxElement.openingElement;
    const componentPropValue = getPropValueFromAttributes(
      'thing',
      node.attributes
    );
    expect(generate(componentPropValue).code).toEqual(
      'typeof spread === "object" && spread !== null && spread.thing || Wow'
    );
  });

  it('handles two spread operators', () => {
    const ast = parse(`<Block thing={Wow} {...one} {...two} />`);
    const statement = ast.program.body[0] as t.ExpressionStatement;
    const jsxElement = statement.expression as t.JSXElement;
    const node = jsxElement.openingElement;
    const componentPropValue = getPropValueFromAttributes(
      'thing',
      node.attributes
    );
    expect(generate(componentPropValue).code).toEqual(
      'typeof two === "object" && two !== null && two.thing || ' +
        'typeof one === "object" && one !== null && one.thing || Wow'
    );
  });

  // this should be sufficient
  it('handles three spread operators', () => {
    const ast = parse(`<Block className={Wow} {...one} {...two} {...three} />`);
    const statement = ast.program.body[0] as t.ExpressionStatement;
    const jsxElement = statement.expression as t.JSXElement;
    const node = jsxElement.openingElement;
    const componentPropValue = getPropValueFromAttributes(
      'className',
      node.attributes
    );
    expect(generate(componentPropValue).code).toEqual(
      'typeof three === "object" && three !== null && three.className || ' +
        'typeof two === "object" && two !== null && two.className || ' +
        'typeof one === "object" && one !== null && one.className || Wow'
    );
  });

  it('ignores spread operators that come before the prop', () => {
    const ast = parse(`<Block {...one} className={Wow} {...two} {...three} />`);
    const statement = ast.program.body[0] as t.ExpressionStatement;
    const jsxElement = statement.expression as t.JSXElement;
    const node = jsxElement.openingElement;
    const componentPropValue = getPropValueFromAttributes(
      'className',
      node.attributes
    );
    expect(generate(componentPropValue).code).toEqual(
      'typeof three === "object" && three !== null && three.className || ' +
        'typeof two === "object" && two !== null && two.className || Wow'
    );
  });

  it('throws an error if the spread operator is not a identifier or member expression', () => {
    const ast = parse(`<Block thing={Wow} {...{obj: 'ok'}} />`);
    const statement = ast.program.body[0] as t.ExpressionStatement;
    const jsxElement = statement.expression as t.JSXElement;
    const node = jsxElement.openingElement;
    expect(() => getPropValueFromAttributes('thing', node.attributes)).toThrow(
      /Unhandled spread operator value of type `ObjectExpression`/
    );
  });
});
