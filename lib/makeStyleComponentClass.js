'use strict';

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
        component: null,
        style: null
      });
      assign(style, this.props.style);

      return React.createElement(
        this.props.component || tagName,
        assign(
          {},
          this.props.props || {},
          {style: autoprefix(style), children: this.props.children}
        )
      );
    }
  });

  return Style;
}

module.exports = makeStyleComponentClass;
