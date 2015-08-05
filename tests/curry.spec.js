'use strict';

var Inline = require('../Inline');
var React = require('react');
var curry = require('../curry');

describe('curry', function() {
  it('works', function() {
    var StandardText = curry(Inline, {color: 'gray', fontSize: 12});
    var EmphText = curry(Inline, {fontWeight: 'bold', color: 'black'});
    var markup = React.renderToStaticMarkup(
      React.createElement(
        'div', null,
        React.createElement(StandardText, null, 'hello world'),
        React.createElement(EmphText, null, 'goodbye world'),
        React.createElement(EmphText, {color: 'green', textDecoration: 'underline'}, 'I dont know whats going on')
      )
    );
    expect(markup).toBe(
      '<div><div style="color:gray;font-size:12px;display:inline;">hello world</div><div style="font-weight:bold;' +
        'color:black;display:inline;">goodbye world</div><div style="font-weight:bold;color:green;text-decoration:' +
        'underline;display:inline;">I dont know whats going on</div></div>'
    );
  });
});
