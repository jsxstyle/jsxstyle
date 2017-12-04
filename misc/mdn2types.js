#!/usr/bin/env node

const prettier = require('prettier');

const generate = require('../packages/jsxstyle-loader/utils/ast/generate');
const t = require('@babel/types');

const mdnProps = require('./mdn-css-properties.json');
const typeAliases = [];
const interfaceBody = [];

const interfaceId = t.identifier('MDNCSSProperties');

// https://developer.mozilla.org/en-US/docs/Web/CSS/Value_definition_syntax
function string2annotation(str) {
  if (/^[a-z-| ]+$/.test(str)) {
    if (str.indexOf(' | ') > -1) {
      return t.tSTypeAnnotation(
        t.tSUnionType(
          str.split(' | ').map(s => t.tSLiteralType(t.stringLiteral(s)))
        )
      );
    }
  }
  // return `any` for funky props
  return t.tSTypeAnnotation(t.tSAnyKeyword());
}

function toDocstring(str) {
  return (
    '*\n' +
    str
      .trim()
      .split('\n')
      .map(s => ` * ${s}`)
      .join('\n') +
    '\n '
  );
}

function oxfordList(items) {
  const items2 = items.slice(0);
  if (items2.length === 2) {
    return items2.join(' and ');
  }
  const last = items2.pop();
  return `${items2.join(', ')}, and ${last}`;
}

for (const k in mdnProps) {
  // skip the weirdos
  if (!/^[a-z]/i.test(k)) continue;

  const obj = mdnProps[k];

  const ccName = k
    .split('-')
    .map((k, i) => (i === 0 ? k : k[0].toUpperCase() + k.slice(1)))
    .join('');

  const thing = t.tSPropertySignature(
    t.identifier(ccName),
    string2annotation(obj.syntax)
  );

  // hmmm...
  thing.optional = true;

  const computed = Array.isArray(obj.computed)
    ? `\nShorthand for ${oxfordList(obj.computed)}`
    : '';

  t.addComment(
    thing,
    'leading',
    toDocstring(`
Syntax: ${obj.syntax}
Status: ${obj.status}${computed}
`)
  );

  interfaceBody.push(thing);
}

const dec = t.tSInterfaceDeclaration(
  interfaceId,
  null,
  null,
  t.TSInterfaceBody(interfaceBody)
);

t.addComment(dec, 'leading', ' CSSProperties generated from MDN data ');

console.log(
  prettier.format(
    generate(
      t.program(
        [].concat(typeAliases, dec, t.ExportDefaultDeclaration(interfaceId))
      )
    ).code
  )
);
