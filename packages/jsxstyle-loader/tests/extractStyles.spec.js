'use strict';

const extractStyles = require('../lib/ast-utils/extractStyles');
const fs = require('fs');
const path = require('path');

const EXAMPLE_SRC = fs.readFileSync(path.join(__dirname, 'example.js'), {encoding: 'utf8'});

describe('extractStyles', function() {
  it('can extract constant styles', function() {
    const rv = extractStyles(EXAMPLE_SRC, '/jsxstyle/constant-styles.css', {LayoutConstants: {x: 10}});
    expect(rv).toEqual({
      js: `require("/jsxstyle/constant-styles.css");
const React = require('react');
const {Block, InlineBlock} = require('../');

<div className="__s_0">
  <div className="__s_1" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</div>;
`,
      css: `.__s_0 {
  width:100%;
  height:25px;
  left:20px;
  display:block;
}
.__s_0:hover {
  color:blue;
  background-color:white;
}
.__s_1 {
  height:24px;
  display:inline-block;
}
`,
      map: undefined,
    });
  });

  it('can extract simple expressions', function() {
    const rv = extractStyles(EXAMPLE_SRC, '/jsxstyle/extract-expressions.css', {LayoutConstants: {x: 10}});
    expect(rv).toEqual({
      js: `require("/jsxstyle/extract-expressions.css");
const React = require('react');
const {Block, InlineBlock} = require('../');

<div className="__s_0">
  <div className="__s_1" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</div>;
`,
      css: `.__s_0 {
  width:100%;
  height:25px;
  left:20px;
  display:block;
}
.__s_0:hover {
  color:blue;
  background-color:white;
}
.__s_1 {
  height:24px;
  display:inline-block;
}
`,
      map: undefined,
    });
  });

  it('can create nice looking css', function() {
    const rv = extractStyles(EXAMPLE_SRC, '/jsxstyle/nice-looking.css', {LayoutConstants: {x: 10}}, function(entry) {
      const node = entry.node;
      return {
        className: 'example_line' + node.loc.start.line,
        commentText: 'example.js:' + node.loc.start.line,
      };
    });
    expect(rv).toEqual({
      js: `require("/jsxstyle/nice-looking.css");
const React = require('react');
const {Block, InlineBlock} = require('../');

<div className="example_line4">
  <div className="example_line5" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</div>;
`,
      css: `/* example.js:4 */
.example_line4 {
  width:100%;
  height:25px;
  left:20px;
  display:block;
}
.example_line4:hover {
  color:blue;
  background-color:white;
}
/* example.js:5 */
.example_line5 {
  height:24px;
  display:inline-block;
}
`,
      map: undefined,
    });
  });
});
