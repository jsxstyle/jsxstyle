'use strict';

const {Inline} = require('../');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

describe('className', function() {
  it('works', function() {
    const markup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Inline, {className: 'bla', color: 'red'}, 'honk')
    );
    expect(markup).toBe('<div class="bla jsxstyle0">honk</div>');
  });
});
