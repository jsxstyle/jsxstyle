#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const readmeTemplate = fs.readFileSync(
  path.join(__dirname, 'readme-template.md'),
  'utf8'
);

[
  {
    PACKAGE_NAME: 'jsxstyle',
    CREATEELEMENT_IMPORT: `import React from 'react';`,
    RENDERTOSTRING_IMPORT: `import React from 'react';
import { renderToString } from 'react-dom';`,
    CLASSNAME: 'className',
  },
  {
    PACKAGE_NAME: 'jsxstyle-preact',
    CREATEELEMENT_IMPORT: `import { h } from 'preact';`,
    RENDERTOSTRING_IMPORT: `import { h, renderToString } from 'preact';`,
    CLASSNAME: 'class',
  },
].forEach(obj => {
  let tpl = readmeTemplate;
  for (const key in obj) {
    const value = obj[key];
    tpl = tpl.replace(new RegExp(key, 'g'), value);
  }

  fs.writeFileSync(
    path.resolve(__dirname, '..', 'packages', obj.PACKAGE_NAME, 'README.md'),
    tpl
  );
});
