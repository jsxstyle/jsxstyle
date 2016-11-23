'use strict';

var React = require('react');
var ReactDOMServer = require('react-dom/server');
var Col = require('../Col');

describe("willChange", function() {
  it("inlines styles that will change", function() {
    const rendered = ReactDOMServer.renderToString(
      React.createElement(
        Col,
        {
          willChange: ["transform"],
          transform: "translateY(56px)",
          width: "100vw",
          height: 56,
        }
      )
    );

    expect(rendered).toMatch(/transform:translateY\(56px\)/);
  });

  it("accepts a single string property", function() {
    const rendered = ReactDOMServer.renderToString(
      React.createElement(
        Col,
        {
          willChange: "transform",
          transform: "translateY(56px)",
          opacity: 0,
          width: "100vw",
          height: 56,
        }
      )
    );

    expect(rendered).toMatch(/transform:translateY\(56px\)/);
  });

  it("parses comma-separated strings", function() {
    const rendered = ReactDOMServer.renderToString(
      React.createElement(
        Col,
        {
          willChange: "transform, opacity",
          transform: "translateY(56px)",
          opacity: 0,
          width: "100vw",
          height: 56,
        }
      )
    );

    expect(rendered).toMatch(/transform:translateY\(56px\)/);
    expect(rendered).toMatch(/opacity:0/);
  });

  it("will not inline styles that won't change", function() {
    const rendered = ReactDOMServer.renderToString(
      React.createElement(
        Col,
        {
          willChange: ["transform"],
          transform: "translateY(56px)",
          width: "100vw",
          height: 56,
        }
      )
    );

    expect(rendered).not.toMatch(/height:56/);
  });
});
