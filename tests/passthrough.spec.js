'use strict';

var Block = require('../Block');
var React = require('react');
var ReactDOMServer = require('react-dom/server');

describe('passthrough', function() {
  it('treats non-css properties as attributes', function() {
    var element = React.createElement('div', null,
      React.createElement(Block, {
        id: 'foo',
        color: 'green',
        foo: 'bar',
        ['data-baz']: 'qux',
      }, 'ayyy')
    );

    var markup = ReactDOMServer.renderToStaticMarkup(element);
    expect(markup).toBe(
      '<div><div id="foo" data-baz="qux" class=" jsxstyle0">ayyy</div></div>'
    );
  });
});
