#!/usr/bin/env node
'use strict';

const fs = require('fs');
const prettier = require('prettier');

const parse = require('../packages/jsxstyle-loader/utils/ast/parse');
const generate = require('../packages/jsxstyle-loader/utils/ast/generate');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const reactTypeFile = require.resolve('@types/react/index.d.ts');
const fileContents = fs.readFileSync(reactTypeFile, 'utf8');
const ast = parse(fileContents, 'typescript');

const typeAliases = [];
const interfaceBody = [];

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
      interfaceBody.push(item);
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
