'use strict';

var GlobalStylesheets = require('./GlobalStylesheets');
var React = require('react');

var assign = require('object-assign');
var autoprefix = require('./autoprefix');

function objectWithoutProperties(obj, keys) {
  var target = {};
  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }
  return target;
}

function getStyleFromProps(props) {
  var style = assign({}, props, {
    children: null,
    className: null,
    component: null,
    style: null
  });
  assign(style, props.style);
  return style;
}

function makeStyleComponentClass(defaults, displayName, tagName, blacklistedProps) {
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
      var rest = blacklistedProps ? objectWithoutProperties(props, blacklistedProps) : props;
      this.styleKey = GlobalStylesheets.getKey(getStyleFromProps(rest));
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
      var props = blacklistedProps ? objectWithoutProperties(this.props, blacklistedProps) : this.props;
      var style = getStyleFromProps(props);
      var className = GlobalStylesheets.getClassName(this.styleKey);
      if (blacklistedProps) {
        var propsPayload = {};
        var self = this;
        blacklistedProps.forEach(function(e) {
          propsPayload[e] = self.props[e];
        })
        return React.createElement(
          this.props.component || tagName, assign({},
          {
            className: (this.props.className || '') + ' ' + className,
            children: this.props.children,
          },
            propsPayload
          )
        );
      } else {
        return React.createElement(
          this.props.component || tagName,
          {
            className: (this.props.className || '') + ' ' + className,
            children: this.props.children,
          }
        );
      }
    }
  });

  return Style;
}

module.exports = makeStyleComponentClass;
