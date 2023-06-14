import type { OptionsObject } from '../extractStyles';
import { evaluateAttributes } from '../evaluateAttributes';
import type { NodeValue, PrimitiveValue } from '../styleObjectUtils';
import { evaluateAstNode } from '../evaluateAstNode';
import * as t from '@babel/types';
import { generate } from '../babelUtils';
import vm from 'vm';

const context = vm.createContext({
  evalIdentifier: 'eval identifier value',
  memberExpression: {
    property: 'eval member expression value',
  },
});

const evalFn = (n: t.Node) => {
  const { code } = generate(n);
  return vm.runInContext(`(${code})`, context);
};

const options: OptionsObject = {
  attemptEval: (n: t.Node) => evaluateAstNode(n, evalFn),
  classPropName: 'className',
  getClassNameForKey: (key) => key,
  logError: console.error,
  logWarning: console.warn,
  noRuntime: false,
  mediaQueriesByKey: {
    mq: 'example mq',
  },
  onInsertRule: (rule, key) => {
    console.log('insert rule:', rule, key);
  },
};

describe('evaluateAttributes', () => {
  it('works', () => {
    const styles: Record<string, PrimitiveValue | NodeValue> = {
      // primitives
      className: { type: 'primitive', value: 'hello' },
      integer: { type: 'primitive', value: 123 },
      string: { type: 'primitive', value: 'abc' },
      object: { type: 'primitive', value: { hello: 123 } },
      '@media thing': { type: 'primitive', value: { color: 'red' } },
      '& banana': { type: 'primitive', value: { color: 'red' } },

      // nodes
      nullLiteral: { type: 'node', value: t.nullLiteral() },
      undefinedIdentifier: { type: 'node', value: t.identifier('undefined') },
      evalIdentifier: { type: 'node', value: t.identifier('evalIdentifier') },
      unknownIdentifier: {
        type: 'node',
        value: t.identifier('unknownIdentifier'),
      },
      memberExpression: {
        type: 'node',
        value: t.memberExpression(
          t.identifier('memberExpression'),
          t.identifier('property')
        ),
      },
    };

    expect(evaluateAttributes(new Map(Object.entries(styles)), options))
      .toMatchInlineSnapshot(`
      {
        "classNameNode": {
          "type": "StringLiteral",
          "value": "hello",
        },
        "componentProps": Map {
          "unknownIdentifier" => {
            "name": "unknownIdentifier",
            "type": "Identifier",
          },
        },
        "runtimeRequired": true,
        "styleObj": {
          "styles": {
            "& banana": {
              "color": "red",
            },
            "@media thing": {
              "color": "red",
            },
            "evalIdentifier": "eval identifier value",
            "integer": 123,
            "memberExpression": "eval member expression value",
            "nullLiteral": null,
            "object": {
              "hello": 123,
            },
            "string": "abc",
            "undefinedIdentifier": undefined,
          },
        },
      }
    `);
  });
});
