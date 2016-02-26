'use strict';

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');
var React = require('react');

var assign = require('object-assign');
var autoprefix = require('./autoprefix');
var invariant = require('invariant');

var PREFIX = 'jsxstyle';

var stylesheetIdSeed = 0;

// TODO: ref count this homie.
var styles = {};

var queuedUpdate = false;
var instance = null;

var Stylesheet = React.createClass({
  shouldComponentUpdate: function() {
    return false;
  },

  render: function() {
    var style = assign({}, this.props.stylesheet.style);
    autoprefix(style);
    var stylesheetText = (
      '\n.' + PREFIX + this.props.stylesheet.id + ' {\n' +
        CSSPropertyOperations.createMarkupForStyles(style) +
        '\n}\n'
    );
    return React.createElement('style', null, stylesheetText);
  },
});

var GlobalStylesheets = React.createClass({
  statics: {
    getClassName: function(styleObj) {
      // Normalize the style obj
      var normalizedStyleObj = {};

      Object.keys(styleObj).sort().forEach(function(key) {
        var value = styleObj[key];
        if (typeof value !== 'string' && typeof value !== 'number' && value != null) {
          value = value.toString();
        }
        normalizedStyleObj[key] = value;
      });

      var key = JSON.stringify(normalizedStyleObj);

      if (!styles.hasOwnProperty(key)) {
        styles[key] = {
          id: stylesheetIdSeed,
          style: styleObj,
        };

        stylesheetIdSeed++;
      }

      if (!queuedUpdate && instance) {
        process.nextTick(function() {
          queuedUpdate = false;
          instance.forceUpdate();
        });
        queuedUpdate = true;
      }

      return PREFIX + styles[key].id;
    },
  },

  componentDidMount: function() {
    invariant(instance === null, 'There must only be one GlobalStylesheets component!');
    instance = this;
  },

  componentWillUnmount: function() {
    instance = null;
  },

  render: function() {
    var styleTags = [];
    for (var key in styles) {
      styleTags.push(React.createElement(Stylesheet, {key: key, stylesheet: styles[key]}));
    }
    return React.createElement('div', {style: {display: 'none'}}, styleTags);
  },
});

module.exports = GlobalStylesheets;
