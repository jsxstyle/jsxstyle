'use strict';

var renameClass = require('../lib/renameClass');

describe('renameClass', function() {
  it('can rename classes', function() {
    var src = '<div className="x"><div className="x y" /></div>';
    expect(renameClass({x: 'test'}, src)).toBe(
      '<div className="test"><div className="test y" /></div>'
    );
  });
});
