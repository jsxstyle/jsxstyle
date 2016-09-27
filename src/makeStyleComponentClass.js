'use strict';

var GlobalStylesheets = require('./GlobalStylesheets');
var React = require('react');

var assign = require('object-assign');

function getStyleFromProps(props) {
  var style = {};

  for (let key in props) {
    if (key === 'children' ||
        key === 'className' ||
        key === 'component' ||
        key === 'props' ||
        key === 'style') {
      continue;
    }
    style[key] = props[key];
  }

  assign(style, props.style);
  return style;
}

function makeStyleComponentClass(defaults, displayName, tagName) {
  tagName = tagName || 'div';

  var Style = React.createClass({
    displayName: displayName || 'Style',

    statics: {
      style: defaults
    },

    getDefaultProps: function() {
      return defaults;
    },

    refStyleKey: function(props) {
      this.styleKey = GlobalStylesheets.getKey(getStyleFromProps(props));
      GlobalStylesheets.ref(this.styleKey);
    },

    componentWillMount: function() {
      this.refStyleKey(this.props);
    },

    componentWillReceiveProps: function(nextProps) {
      GlobalStylesheets.unref(this.styleKey);
      this.refStyleKey(nextProps);
    },

    componentWillUnmount: function() {
      GlobalStylesheets.unref(this.styleKey);
    },

    render: function() {
      var style = getStyleFromProps(this.props);
      var className = GlobalStylesheets.getClassName(this.styleKey);

      return React.createElement(
        this.props.component || tagName,
        assign({
          className: (this.props.className || '') + ' ' + className,
          children: this.props.children,
        }, this.props.props)
      );
    }
  });

  return Style;
}

module.exports = makeStyleComponentClass;
