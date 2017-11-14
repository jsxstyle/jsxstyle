'use strict';

const getStaticBindingsForScope = require('../utils/ast/getStaticBindingsForScope');

const traverse = require('babel-traverse').default;
const parse = require('../utils/ast/parse');
const path = require('path');

const whitelistedModules = [require.resolve('./mock/LC')];

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

  const testItems = {};
  traverse(ast, {
    JSXElement(path) {
      const node = path.node.openingElement;
      testItems[node.name.name] = {
        scope: path.scope,
        attrs: {},
      };

      node.attributes.forEach(attr => {
        testItems[node.name.name].attrs[attr.name.name] = attr.value.expression;
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
    const proxiedCache = new Proxy(bindingCache, {
      set(target, name, value) {
        setFn();
        target[name] = value;
      },
      get(target, name) {
        getFn();
        return target[name];
      },
    });

    const blockBindings = getStaticBindingsForScope(
      testItems.Block.scope,
      whitelistedModules,
      path.resolve(__dirname, 'mock', 'demo.js'),
      proxiedCache
    );

    expect(blockBindings).toEqual({
      LC: require('./mock/LC'),
      blue: 'blueberry',
      nullLiteral: null,
      outerLiteral: 42,
      outerObject: {
        value: 28980,
      },
      innerLiteral: 'wow',
    });

    expect(bindingCache).toEqual({
      'innerLiteral_240-245': 'wow',
      'nullLiteral_295-299': null,
      'outerLiteral_22-24': 42,
      'outerObject_46-68': { value: 28980 },
    });

    expect(setFn).toHaveBeenCalledTimes(4);
    expect(getFn).toHaveBeenCalledTimes(4);
  });
});
