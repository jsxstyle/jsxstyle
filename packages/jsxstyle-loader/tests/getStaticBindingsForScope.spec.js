'use strict';

const getStaticBindingsForScope = require('../lib/ast-utils/getStaticBindingsForScope');

const traverse = require('babel-traverse').default;
const parse = require('../lib/ast-utils/parse');
const path = require('path');

const whitelistedModules = [require.resolve('./mock/LC')];

describe('getStaticBindingsForScope', function() {
  const ast = parse(`
const outerValue = 42;
import LC from './LC';
import {Block} from 'jsxstyle';

function outerFunction(innerParam1, innerParam2) {
  const innerValue = 'wow';
  const nullLiteral = null;

  return <Block
    prop1={innerValue}
    prop2={LC.staticValue}
    prop3={outerValue}
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

  it('traverses the source correctly', function() {
    expect(Object.keys(testItems)).toEqual(['Block']);
    expect(Object.keys(testItems.Block.attrs)).toEqual([
      'prop1',
      'prop2',
      'prop3',
    ]);
  });

  it('does the thing', function() {
    const bindings = getStaticBindingsForScope(
      testItems.Block.scope,
      whitelistedModules,
      path.resolve(__dirname, 'mock', 'demo.js')
    );

    expect(bindings).toEqual({
      LC: require('./mock/LC'),
      nullLiteral: null,
      outerValue: 42,
      innerValue: 'wow',
    });
  });
});
