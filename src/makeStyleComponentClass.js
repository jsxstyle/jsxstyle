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
      this.styleKey = GlobalStylesheets.getKey(getStyleFromProps(props), displayName, this.component);
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

      return React.createElement(
        this.component,
        assign({}, this.props.props, {
          className: (className || this.props.className) ? ((this.props.className || '') + ' ' + (className || '')) : null,
          children: this.props.children,
          style: this.props.style,
        })
      );
    }
  });

  return Style;
}

module.exports = makeStyleComponentClass;
