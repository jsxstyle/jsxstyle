'use strict';

var Block = require('../Block');
var GlobalStylesheets = require('../lib/GlobalStylesheets');
var React = require('react');
var ReactDOMServer = require('react-dom/server');

describe('passthrough', function() {
  it('treats non-css properties as attributes', function() {
    GlobalStylesheets.reset();
    var element = React.createElement('div', null,
      React.createElement(Block, {
        id: 'foo',
        color: 'orange',
        hoverColor: 'blue',
        foo: 'bar',
        props: {tabIndex: '4'},
        ['data-baz']: 'qux',
      }, 'ayyy')
    );

    var markup = ReactDOMServer.renderToStaticMarkup(element);
    expect(markup).toBe(
      '<div><div id="foo" data-baz="qux" tabindex="4" class=" jsxstyle0">ayyy</div></div>'
    );
  });
});
