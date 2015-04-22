'use strict';

var extractStyles = require('../lib/extractStyles');
var fs = require('fs');
var path = require('path');

var EXAMPLE_SRC = fs.readFileSync(path.join(__dirname, 'example.js'), {encoding: 'utf8'});

describe('extractStyles', function() {
  it('can extract constant styles', function() {
    var rv = extractStyles(EXAMPLE_SRC);
    expect(rv).toEqual({
      js: "<div\n  style={{\n    \"left\": 2 * LayoutConstants.x\n  }}\n  className=\"__s_0\">\n  <div className=\"__s_1\" />\n  <div style={{width: 10}} />\n  <OtherComponent height={25} />\n</Block>\n",
      css: ".__s_0 {\n  width:100%;\n  height:25px;\n  display:block;\n}\n\n.__s_1 {\n  height:24px;\n  display:inline-block;\n}\n\n"
    });
  });

  it('can extract simple expressions', function() {
    //
  });
});
