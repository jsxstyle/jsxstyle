import generate from '@babel/generator';
import traverse from '@babel/traverse';
import t = require('@babel/types');
import path = require('path');

import { getStaticBindingsForScope } from '../getStaticBindingsForScope';
import { parse } from '../parse';

const modulesByAbsolutePath = {
  [require.resolve('./mock/LC')]: require('./mock/LC'),
};

describe('getStaticBindingsForScope', () => {
  const ast = parse(`
const outerLiteral = 42;
const outerObject = {
  value: 69 * 420,
};

import LC from './LC';
import { blue } from './LC';
import { Inline, Block } from 'jsxstyle';

function outerFunction(innerParam1, innerParam2) {
  const innerLiteral = 'wow';
  const innerObject = {};
  const nullLiteral = null;

  <Inline />;

  return <Block
    prop1={innerLiteral}
    prop2={LC.staticValue}
    prop3={outerLiteral}
  />;
}
`);

  const testItems: Record<
    string,
    { attrs: Record<string, any>; scope: any }
  > = {};
  traverse(ast, {
    JSXElement(traversePath) {
      const node = traversePath.node.openingElement;
      const nodeName = node.name;
      if (!t.isJSXIdentifier(nodeName)) {
        throw new Error(
          'Received invalid node name: ' + generate(node.name).code
        );
      }
      testItems[nodeName.name] = {
        attrs: {},
        scope: traversePath.scope,
      };

      node.attributes.forEach((attr) => {
        if (
          !t.isJSXAttribute(attr) ||
          typeof attr.name.name !== 'string' ||
          !t.isJSXExpressionContainer(attr.value)
        ) {
          throw new Error(
            'Received invalid JSXAttribute: ' + generate(attr).code
          );
        }
        testItems[nodeName.name].attrs[attr.name.name] = attr.value.expression;
      });
    },
  });

  it('traverses the source correctly', () => {
    expect(Object.keys(testItems)).toEqual(['Inline', 'Block']);
    expect(Object.keys(testItems.Block.attrs)).toEqual([
      'prop1',
      'prop2',
      'prop3',
    ]);
  });

  it('extracts static bindings and utilises the cache', () => {
    const bindingCache = {};
    const setFn = jest.fn();
    const getFn = jest.fn();
    const thingsToSet: any[] = [];
    const thingsToGet: any[] = [];
    const proxiedCache = new Proxy(bindingCache, {
      set(target, name, value) {
        setFn();
        thingsToSet.push(name);
        return Reflect.set(target, name, value);
      },
      getOwnPropertyDescriptor(target, name) {
        getFn();
        thingsToGet.push(name);
        return Reflect.getOwnPropertyDescriptor(target, name);
      },
    });

    const blockBindings = getStaticBindingsForScope(
      testItems.Block.scope,
      modulesByAbsolutePath,
      path.resolve(__dirname, 'mock', 'demo.js'),
      proxiedCache
    );

    expect(blockBindings).toEqual({
      blue: 'blueberry',
      innerLiteral: 'wow',
      LC: require('./mock/LC'),
      nullLiteral: null,
      outerLiteral: 42,
      outerObject: {
        value: 28980,
      },
    });

    const results = {
      'innerLiteral_225-237': 'wow',
      'nullLiteral_281-292': null,
      'outerLiteral_7-19': 42,
      'outerObject_32-43': { value: 28980 },
    };

    expect(bindingCache).toEqual(results);
    expect(setFn).toHaveBeenCalledTimes(4);
    expect(getFn).toHaveBeenCalledTimes(5);
    expect(thingsToSet).toEqual(Object.keys(results));
    expect(thingsToGet).toEqual([
      'innerLiteral_225-237',
      'innerObject_255-266',
      'nullLiteral_281-292',
      'outerLiteral_7-19',
      'outerObject_32-43',
    ]);
  });
});
