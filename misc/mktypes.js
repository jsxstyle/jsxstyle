#!/usr/bin/env node
'use strict';

const fs = require('fs');
const prettier = require('prettier');
const invariant = require('invariant');

const parse = require('../packages/jsxstyle-loader/utils/ast/parse');
const generate = require('../packages/jsxstyle-loader/utils/ast/generate');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const reactTypeFile = require.resolve('@types/react/index.d.ts');
const fileContents = fs.readFileSync(reactTypeFile, 'utf8');
const ast = parse(fileContents, 'typescript');

const typeAliases = [];
const interfaceBody = [];

function reformatComments(node, comments) {
  const leadingComments = comments || node.leadingComments;
  t.removeComments(node);
  if (leadingComments) {
    t.addComments(
      node,
      'leading',
      leadingComments.map(c => ({ type: 'CommentBlock', value: c.value }))
    );
  }
}

traverse(ast, {
  TSTypeAliasDeclaration(path) {
    if (!path.node.id.name.startsWith('CSS')) return;
    reformatComments(path.node);
    typeAliases.push(path.node);
  },

  TSInterfaceDeclaration(path) {
    if (path.node.id.name !== 'CSSProperties') return;

    path.node.body.body.forEach(item => {
      invariant(
        t.isTSIndexSignature(item) || t.isTSPropertySignature(item),
        'Unhandled type: %s',
        item.type
      );

      reformatComments(item);
      interfaceBody.push(item);
    });
  },
});

const interfaceId = t.identifier('CSSProperties');

const dec = t.tSInterfaceDeclaration(
  interfaceId,
  null,
  null,
  t.TSInterfaceBody(interfaceBody)
);

t.addComment(dec, 'leading', ' CSSProperties extracted from @types/react ');

console.log(
  prettier.format(
    generate(
      t.program(
        [].concat(typeAliases, dec, t.ExportDefaultDeclaration(interfaceId))
      )
    ).code
  )
);
