'use strict';

const {Inline} = require('../');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const getClassName = require('../src/getClassName');

describe('className', function() {
  it('combines class names if `className` prop is present', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(<Inline className="bla" color="red">honk</Inline>);
    expect(markup).toBe('<div class="bla _j1ioutjs">honk</div>');
  });

  it('generates deterministic class names', () => {
    const className = getClassName('wow', 'prefix');
    expect(className).toBe('prefix375v8q');
  });
});
