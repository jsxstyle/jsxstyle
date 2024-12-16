import * as path from 'node:path';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { parse } from '../babelUtils';
import { getStaticBindingsForScope } from '../getStaticBindingsForScope';

import * as LC from './mock/LC';
const LCPath = new URL('./mock/LC', import.meta.url).pathname;

const modulesByAbsolutePath = {
  [LCPath]: LC,
};

describe('getStaticBindingsForScope', () => {
  const ast = parse(`
const outerLiteral = 42;
const outerObject = {
  value: 69 * 420,
};

import LC from './LC';
import { blue } from './LC';
import { Inline, Block } from '@jsxstyle/react';

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

  const testItems: Record<string, { attrs: Record<string, any>; scope: any }> =
    {};
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

      for (const attr of node.attributes) {
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
      }
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
    const setFn = vi.fn();
    const getFn = vi.fn();
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
      LC: LC,
      nullLiteral: null,
      outerLiteral: 42,
      outerObject: {
        value: 28980,
      },
    });

    expect(bindingCache).toMatchInlineSnapshot(`
      {
        "innerLiteral_232-244": "wow",
        "nullLiteral_288-299": null,
        "outerLiteral_7-19": 42,
        "outerObject_32-43": {
          "value": 28980,
        },
      }
    `);
    expect(setFn).toHaveBeenCalledTimes(4);
    expect(getFn).toHaveBeenCalledTimes(5);
    expect(thingsToSet).toMatchInlineSnapshot(`
      [
        "innerLiteral_232-244",
        "nullLiteral_288-299",
        "outerLiteral_7-19",
        "outerObject_32-43",
      ]
    `);
    expect(thingsToGet).toMatchInlineSnapshot(`
      [
        "innerLiteral_232-244",
        "innerObject_262-273",
        "nullLiteral_288-299",
        "outerLiteral_7-19",
        "outerObject_32-43",
      ]
    `);
  });
});
