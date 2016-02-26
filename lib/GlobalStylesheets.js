'use strict';

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');
var React = require('react');

var assign = require('object-assign');
var autoprefix = require('./autoprefix');
var immediate = require('immediate');
var invariant = require('invariant');

var PREFIX = 'jsxstyle';

var stylesheetIdSeed = 0;

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

function update() {
  queuedUpdate = false;
  instance.forceUpdate();
}

function queueUpdate() {
  if (!queuedUpdate && instance) {
    // TODO: need setImmediate()
    immediate(update);
    queuedUpdate = true;
  }
}

function reap() {
  for (var key in styles) {
    if (styles[key].refs === 0) {
      delete styles[key];
      queueUpdate();
    }
  }
}

var GlobalStylesheets = React.createClass({
  statics: {
    install: function() {
      setInterval(reap, 10000);
      var element = document.createElement('div');
      document.body.appendChild(element);
      React.render(React.createElement(GlobalStylesheets), element);
    },

    getKey: function(styleObj) {
      var pairs = [];

      Object.keys(styleObj).sort().forEach(function(key) {
        var value = styleObj[key];
        if (typeof value !== 'string' && typeof value !== 'number' && value != null) {
          value = value.toString();
        }
        pairs.push(key + ':' + value);
      });

      var key = pairs.join(',');

      if (!styles.hasOwnProperty(key)) {
        styles[key] = {
          id: stylesheetIdSeed,
          style: styleObj,
          refs: 0,
        };

        stylesheetIdSeed++;
      }

      queueUpdate();

      return key;
    },

    ref: function(key) {
      styles[key].refs++;
    },

    unref: function(key) {
      if (--styles[key].refs === 0) {
        queueUpdate();
      }
    },

    getClassName: function(key) {
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
