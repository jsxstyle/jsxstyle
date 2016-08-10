'use strict';

var Inline = require('../Inline');
var React = require('react');
var ReactDOMServer = require('react-dom/server');

describe('className', function() {
  it('works', function() {
    var markup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Inline, {className: 'bla', color: 'red'}, 'honk')
    );
    expect(markup).toBe('<div style="color:red;display:inline;" class="bla">honk</div>');
  });
});
