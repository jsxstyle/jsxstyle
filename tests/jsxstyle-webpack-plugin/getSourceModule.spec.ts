import traverse from '@babel/traverse';
import getSourceModule from '../../packages/jsxstyle-webpack-plugin/lib/utils/ast/getSourceModule';
import parse from '../../packages/jsxstyle-webpack-plugin/lib/utils/ast/parse';

function getSourceModuleForItem(itemName, scope) {
  let itemBinding = null;

  if (scope.hasBinding(itemName)) {
    itemBinding = scope.getBinding(itemName);
  } else {
    console.warn('Item `%s` is not in scope', itemName);
    return null;
  }

  return getSourceModule(itemName, itemBinding);
}

describe('getSourceModule', () => {
  const ast = parse(`
const Thing1 = require('thing');
const {Destructured1} = require('destructured');
const {Original: Reassigned1} = require('reassigned');

import Thing2 from 'thing';
import {Destructured2} from 'destructured';
import {Original as Reassigned2} from 'reassigned';

<Thing1 />;
<Thing2 />;
<Destructured1 />;
<Destructured2 />;
<Reassigned1 />;
<Reassigned2 />;
`);

  const testItems: Record<string, any> = {};
  traverse(ast, {
    JSXElement(path) {
      const node = path.node.openingElement;
      testItems[node.name.name] = {
        node,
        scope: path.scope,
      };
    },
  });

  it('traverses the source correctly', () => {
    expect(Object.keys(testItems)).toEqual([
      'Thing1',
      'Thing2',
      'Destructured1',
      'Destructured2',
      'Reassigned1',
      'Reassigned2',
    ]);
  });

  it('handles regular requires', () => {
    const { node, scope } = testItems.Thing1;
    const itemName = node.name.name;
    const sourceModule = getSourceModuleForItem(itemName, scope);

    expect(sourceModule).not.toBeNull();
    expect(sourceModule.destructured).toEqual(false);
    expect(sourceModule.imported).toEqual('Thing1');
    expect(sourceModule.local).toEqual('Thing1');
    expect(sourceModule.sourceModule).toEqual('thing');
  });

  it('handles destructured requires', () => {
    const { node, scope } = testItems.Destructured1;
    const itemName = node.name.name;
    const sourceModule = getSourceModuleForItem(itemName, scope);

    expect(sourceModule).not.toBeNull();
    expect(sourceModule.destructured).toEqual(true);
    expect(sourceModule.imported).toEqual('Destructured1');
    expect(sourceModule.local).toEqual('Destructured1');
    expect(sourceModule.sourceModule).toEqual('destructured');
  });

  it('handles reassigned requires', () => {
    const { node, scope } = testItems.Reassigned1;
    const itemName = node.name.name;
    const sourceModule = getSourceModuleForItem(itemName, scope);

    expect(sourceModule).not.toBeNull();
    expect(sourceModule.destructured).toEqual(true);
    expect(sourceModule.imported).toEqual('Original');
    expect(sourceModule.local).toEqual('Reassigned1');
    expect(sourceModule.sourceModule).toEqual('reassigned');
  });

  it('handles regular imports', () => {
    const { node, scope } = testItems.Thing2;
    const itemName = node.name.name;
    const sourceModule = getSourceModuleForItem(itemName, scope);

    expect(sourceModule).not.toBeNull();
    expect(sourceModule.destructured).toEqual(false);
    expect(sourceModule.imported).toEqual('Thing2');
    expect(sourceModule.local).toEqual('Thing2');
    expect(sourceModule.sourceModule).toEqual('thing');
  });

  it('handles destructured imports', () => {
    const { node, scope } = testItems.Destructured2;
    const itemName = node.name.name;
    const sourceModule = getSourceModuleForItem(itemName, scope);

    expect(sourceModule).not.toBeNull();
    expect(sourceModule.destructured).toEqual(true);
    expect(sourceModule.imported).toEqual('Destructured2');
    expect(sourceModule.local).toEqual('Destructured2');
    expect(sourceModule.sourceModule).toEqual('destructured');
  });

  it('handles reassigned imports', () => {
    const { node, scope } = testItems.Reassigned2;
    const itemName = node.name.name;
    const sourceModule = getSourceModuleForItem(itemName, scope);

    expect(sourceModule).not.toBeNull();
    expect(sourceModule.destructured).toEqual(true);
    expect(sourceModule.imported).toEqual('Original');
    expect(sourceModule.local).toEqual('Reassigned2');
    expect(sourceModule.sourceModule).toEqual('reassigned');
  });
});
