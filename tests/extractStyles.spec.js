'use strict';

var extractStyles = require('../lib/extractStyles');
var fs = require('fs');
var path = require('path');

var EXAMPLE_SRC = fs.readFileSync(path.join(__dirname, 'example.js'), {encoding: 'utf8'});

describe('extractStyles', function() {
  it('can extract constant styles', function() {
    var rv = extractStyles(EXAMPLE_SRC);
    expect(rv).toEqual({
      js: `var React = require('react');
var Block = require('../Block');
var InlineBlock = require('../InlineBlock');
<Block left={2 * LayoutConstants.x} display={null} className="__s_0">
  <InlineBlock display={null} className="__s_1" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</Block>
`,
      css: ".__s_0 {\n  width:100%;\n  height:25px;\n  display:block;\n}\n\n.__s_0:hover {\n  color:blue;\n  background-color:white;\n}\n\n.__s_1 {\n  height:24px;\n  display:inline-block;\n}\n\n"
    });
  });

  it('can extract simple expressions', function() {
    var rv = extractStyles(EXAMPLE_SRC, {LayoutConstants: {x: 10}});
    expect(rv).toEqual({
      js: `var React = require('react');
var Block = require('../Block');
var InlineBlock = require('../InlineBlock');
<Block display={null} className="__s_0">
  <InlineBlock display={null} className="__s_1" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</Block>
`,
      css: ".__s_0 {\n  width:100%;\n  height:25px;\n  left:20px;\n  display:block;\n}\n\n.__s_0:hover {\n  color:blue;\n  background-color:white;\n}\n\n.__s_1 {\n  height:24px;\n  display:inline-block;\n}\n\n"
    });
  });

  it('can create nice looking css', function() {
    var rv = extractStyles(EXAMPLE_SRC, {LayoutConstants: {x: 10}}, function(entry) {
      var node = entry.node;
      return {
        className: 'example_line' + node.loc.start.line,
        comment: 'example.js:' + node.loc.start.line,
      };
    });
    expect(rv).toEqual({
      js: `var React = require('react');
var Block = require('../Block');
var InlineBlock = require('../InlineBlock');
<Block display={null} className="example_line4">
  <InlineBlock display={null} className="example_line5" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</Block>
`,
      css: `.example_line4 {
  /* example.js:4 */
  width:100%;
  height:25px;
  left:20px;
  display:block;
}

.example_line4:hover {
  /* example.js:4 */
  color:blue;
  background-color:white;
}

.example_line5 {
  /* example.js:5 */
  height:24px;
  display:inline-block;
}

`,
    });
  });
});
