'use strict';

const recast = require('recast');
const parse = require('../src/ast-utils/parse');

const getPropValueFromAttributes = require('../src/ast-utils/getPropValueFromAttributes');

describe('getPropValueFromAttributes', () => {
  it('returns the original prop value if no spread attributes appear before the requested prop', () => {
    // TODO: update to use `resolves` when Jest 20 is released
    const ast = parse(`<Block {...spread} thing={Wow} />`);
    recast.visit(ast, {
      visitJSXElement(path) {
        const node = path.node.openingElement;
        const componentPropValue = getPropValueFromAttributes('thing', node.attributes);
        expect(recast.print(componentPropValue).code).toEqual('Wow');
        return false;
      },
    });
  });

  it('deals with one spread operator', () => {
    const ast = parse(`<Block thing={Wow} {...spread} />`);
    recast.visit(ast, {
      visitJSXElement(path) {
        const node = path.node.openingElement;
        const componentPropValue = getPropValueFromAttributes('thing', node.attributes);
        expect(recast.print(componentPropValue).code).toEqual(
          'typeof spread === "object" && spread !== null && spread["thing"] || Wow'
        );
        return false;
      },
    });
  });

  it('deals with two spread operators', () => {
    const ast = parse(`<Block thing={Wow} {...one} {...two} />`);
    recast.visit(ast, {
      visitJSXElement(path) {
        const node = path.node.openingElement;
        const componentPropValue = getPropValueFromAttributes('thing', node.attributes);
        expect(recast.print(componentPropValue).code).toEqual(
          'typeof two === "object" && two !== null && two["thing"] || ' +
            '(typeof one === "object" && one !== null && one["thing"] || Wow)'
        );
        return false;
      },
    });
  });

  // this should be sufficient
  it('deals with three spread operators', () => {
    const ast = parse(`<Block thing={Wow} {...one} {...two} {...three} />`);
    recast.visit(ast, {
      visitJSXElement(path) {
        const node = path.node.openingElement;
        const componentPropValue = getPropValueFromAttributes('thing', node.attributes);
        expect(recast.print(componentPropValue).code).toEqual(
          'typeof three === "object" && three !== null && three["thing"] || ' +
            '(typeof two === "object" && two !== null && two["thing"] || ' +
            '(typeof one === "object" && one !== null && one["thing"] || Wow))'
        );
        return false;
      },
    });
  });

  it('throws an error if the spread operator is not a identifier or member expression', () => {
    const ast = parse(`<Block thing={Wow} {...{obj: 'ok'}} />`);
    recast.visit(ast, {
      visitJSXElement(path) {
        const node = path.node.openingElement;
        expect(() => getPropValueFromAttributes('thing', node.attributes)).toThrow(
          /Unhandled spread operator value of type `ObjectExpression`/
        );
        return false;
      },
    });
  });
});
