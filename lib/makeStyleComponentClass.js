'use strict';

var GlobalStylesheets = require('./GlobalStylesheets');
var React = require('react');

var assign = require('object-assign');
var autoprefix = require('./autoprefix');

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

    render: function() {
      var style = assign({}, this.props, {
        children: null,
        className: null,
        component: null,
        style: null
      });
      assign(style, this.props.style);
      var className = GlobalStylesheets.getClassName(style);

      return React.createElement(
        this.props.component || tagName,
        {
          className: (this.props.className || '') + ' ' + className,
          children: this.props.children,
        }
      );
    }
  });

  return Style;
}

module.exports = makeStyleComponentClass;
