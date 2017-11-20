#!/usr/bin/env node
'use strict';

const fs = require('fs');
const prettier = require('prettier');
const invariant = require('invariant');

const parse = require('../packages/jsxstyle-loader/utils/ast/parse');
const generate = require('../packages/jsxstyle-loader/utils/ast/generate');
const traverse = require('@babel/traverse').default;
const { pseudoelements, pseudoclasses } = require('../packages/jsxstyle-utils');
const t = require('@babel/types');

const reactTypeFile = require.resolve('@types/react/index.d.ts');
const fileContents = fs.readFileSync(reactTypeFile, 'utf8');
const ast = parse(fileContents, 'typescript');

const typeAliases = [];
const interfaceBody = [];

const prefixes = new Set();
for (const pc in pseudoclasses) {
  prefixes.add(pc);
  for (const pe in pseudoelements) {
    prefixes.add(pe);
    prefixes.add(pc + pe[0].toUpperCase() + pe.slice(1));
  }
}

// Wrap node in an export and move leading comments from the node to the export
function getWrappedExport(node) {
  const leadingComments = node.leadingComments;
  const wrappedExport = t.ExportNamedDeclaration(t.removeComments(node), []);
  wrappedExport.leadingComments = leadingComments;
  return wrappedExport;
}

traverse(ast, {
  TSTypeAliasDeclaration(path) {
    if (!path.node.id.name.startsWith('CSS')) return;
    typeAliases.push(path.node);
  },

  TSInterfaceDeclaration(path) {
    if (path.node.id.name !== 'CSSProperties') return;

    path.node.body.body.forEach(item => {
      if (t.isTSIndexSignature(item)) {
        interfaceBody.push(item);
        return;
      }
      invariant(t.isTSPropertySignature(item), 'Unhandled type: %s', item.type);

      interfaceBody.push(item);
      prefixes.forEach(prefix => {
        const prefixedItem = t.tSPropertySignature(
          t.identifier(
            prefix + item.key.name[0].toUpperCase() + item.key.name.slice(1)
          ),
          item.typeAnnotation
        );
        prefixedItem.computed = item.computed;
        prefixedItem.optional = item.optional;
        prefixedItem.readonly = item.readonly;
        prefixedItem.leadingComments = item.leadingComments;
        interfaceBody.push(prefixedItem);
      });
    });
  },
});

const dec = t.tSInterfaceDeclaration(
  t.identifier('CSSProperties'),
  null,
  null,
  t.TSInterfaceBody(interfaceBody)
);

console.log(
  prettier.format(
    generate(t.program([].concat(typeAliases, dec).map(getWrappedExport))).code
  )
);
