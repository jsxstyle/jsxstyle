'use strict';

var GlobalStylesheets = require('../lib/GlobalStylesheets');
var Inline = require('../Inline');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var curry = require('../curry');

describe('curry', function() {
  it('works', function() {
    GlobalStylesheets.reset();
    var StandardText = curry(Inline, {color: 'gray', fontSize: 12});
    var EmphText = curry(Inline, {fontWeight: 'bold', color: 'black'});
    var markup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        'div', null,
        React.createElement(StandardText, null, 'hello world'),
        React.createElement(EmphText, null, 'goodbye world'),
        React.createElement(EmphText, {color: 'green', textDecoration: 'underline'}, 'I dont know whats going on')
      )
    );
    expect(markup).toBe(
      '<div><div class=" jsxstyle0">hello world</div><div ' +
        'class=" jsxstyle1">goodbye world</div><div ' +
        'class=" jsxstyle2">I dont know whats going on</div></div>'
    );
  });
});
