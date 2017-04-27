'use strict';

const extractStyles = require('../lib/ast-utils/extractStyles');
const fs = require('fs');
const path = require('path');

const EXAMPLE_SRC = fs.readFileSync(path.join(__dirname, 'example.js'), {encoding: 'utf8'});

describe('extractStyles', function() {
  it('can extract constant styles', function() {
    const rv = extractStyles({
      src: EXAMPLE_SRC,
      sourceFileName: 'test/constant-styles.js',
      staticNamespace: {LayoutConstants: {x: 10}},
      styleGroups: {
        _test: {
          display: 'block',
          hoverColor: 'blue',
        },
      },
      cacheObject: {},
    });
    expect(rv.js).toEqual(
      `require("test/constant-styles.jsxstyle.css");
const React = require('react');
const {Block, InlineBlock} = require('../');

<div className="_test _x0">
  <div className="_x1" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</div>;
`
    );

    expect(rv.css).toEqual(
      `/* test/constant-styles.js:4 (Block) */
._test {
  display:block;
}
._test:hover {
  color:blue;
}
/* test/constant-styles.js:4 (Block) */
._x0 {
  width:100%;
  height:25px;
  left:20px;
}
._x0:hover {
  background-color:white;
}
/* test/constant-styles.js:5 (InlineBlock) */
._x1 {
  height:24px;
  display:inline-block;
}
`
    );
  });

  it('can extract simple expressions', function() {
    const rv = extractStyles({
      src: EXAMPLE_SRC,
      sourceFileName: 'test/extract-expressions.js',
      staticNamespace: {LayoutConstants: {x: 10}},
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require("test/extract-expressions.jsxstyle.css");
const React = require('react');
const {Block, InlineBlock} = require('../');

<div className="_x0">
  <div className="_x1" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</div>;
`
    );

    expect(rv.css).toEqual(
      `/* test/extract-expressions.js:4 (Block) */
._x0 {
  width:100%;
  height:25px;
  left:20px;
  display:block;
}
._x0:hover {
  color:blue;
  background-color:white;
}
/* test/extract-expressions.js:5 (InlineBlock) */
._x1 {
  height:24px;
  display:inline-block;
}
`
    );
  });

  it('can create nice looking css', function() {
    const rv = extractStyles({
      src: EXAMPLE_SRC,
      sourceFileName: 'test/nice-looking.js',
      staticNamespace: {LayoutConstants: {x: 10}},
      cacheObject: {},
    });

    expect(rv.js).toEqual(
      `require("test/nice-looking.jsxstyle.css");
const React = require('react');
const {Block, InlineBlock} = require('../');

<div className="_x0">
  <div className="_x1" />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</div>;
`
    );

    expect(rv.css).toEqual(
      `/* test/nice-looking.js:4 (Block) */
._x0 {
  width:100%;
  height:25px;
  left:20px;
  display:block;
}
._x0:hover {
  color:blue;
  background-color:white;
}
/* test/nice-looking.js:5 (InlineBlock) */
._x1 {
  height:24px;
  display:inline-block;
}
`
    );
  });
});
