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
  displayName = displayName || 'Style';

  var Style = React.createClass({
    displayName: displayName,

    statics: {
      style: defaults
    },

    getDefaultProps: function() {
      return defaults;
    },

    refStyleKey: function(props) {
      this.component = this.props.component || tagName;
      this.styleKey = GlobalStylesheets.getKey(getStyleFromProps(props), this.displayName);
      if (this.styleKey) {
        GlobalStylesheets.ref(this.styleKey);
      }
    },

    componentWillMount: function() {
      this.refStyleKey(this.props);
    },

    componentWillReceiveProps: function(nextProps) {
      if (this.styleKey) {
        GlobalStylesheets.unref(this.styleKey);
      }
      this.refStyleKey(nextProps);
    },

    componentWillUnmount: function() {
      if (this.styleKey) {
        GlobalStylesheets.unref(this.styleKey);
      }
    },

    render: function() {
      var style = getStyleFromProps(this.props);
      var className = this.styleKey ? GlobalStylesheets.getClassName(this.styleKey) : null;
      var classes = [this.props.className, className].filter(a => a).join(' ');

      return React.createElement(
        this.component,
        assign({
          className: classes || null,
          children: this.props.children,
        }, this.props.props)
      );
    }
  });

  return Style;
}

module.exports = makeStyleComponentClass;
