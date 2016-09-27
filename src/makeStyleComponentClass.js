'use strict';

var GlobalStylesheets = require('./GlobalStylesheets');
var React = require('react');

var assign = require('object-assign');

// Subset of inheritable properties we want to disable.
var INHERITABLE_PROPERTIES = {
  // TODO: how do we handle the `font` compound property?
  "color": 'initial',
  "listStyleType": 'initial',
  "fontVariant": 'initial',
  "borderCollapse": 'initial',
  "fontSize": 'initial',
  "lineHeight": 'initial',
  "borderSpacing": 'initial',
  "wordSpacing": 'initial',
  "direction": 'initial',
  "listStylePosition": 'initial',
  "visibility": 'initial',
  "fontWeight": 'initial',
  "letterSpacing": 'initial',
  "textAlign": 'initial',
  "emptyCells": 'initial',
  "fontStyle": 'initial',
  "fontFamily": 'initial',
  "cursor": 'initial',
  "whiteSpace": 'initial',
  "textIndent": 'initial',
  "listStyle": 'initial',
  "listStyleImage": 'initial',
  "textTransform": 'initial',
};

function getStyleFromProps(props, inheritableCssProperties) {
  var style = assign({}, props, {
    children: null,
    className: null,
    component: null,
    style: null,
    props: null
  });
  assign(style, props.style);

  for (var key in (inheritableCssProperties || INHERITABLE_PROPERTIES)) {
    if (!style.hasOwnProperty(key)) {
      style[key] = INHERITABLE_PROPERTIES[key];
    }
  }

  return style;
}

function makeStyleComponentClass(defaults, displayName, tagName) {
  tagName = tagName || 'div';

  var Style = React.createClass({
    displayName: displayName || 'Style',

    contextTypes: {
      jsxstyleInheritableCssProperties: React.PropTypes.object,
    },

    childContextTypes: {
      jsxstyleInheritableCssProperties: React.PropTypes.object,
    },

    statics: {
      style: defaults
    },

    getDefaultProps: function() {
      return defaults;
    },

    getChildContext() {
      if (!this.inheritableCssProperties) {
        var style = getStyleFromProps(this.props, this.context.jsxstyleInheritableCssProperties);
        this.inheritableCssProperties = {};
        for (var key in style) {
          if (INHERITABLE_PROPERTIES[key] && style[key] !== 'auto') {
            this.inheritableCssProperties[key] = true;
          }
        }
      }

      return {
        jsxstyleInheritableCssProperties: this.inheritableCssProperties,
      };
    },

    refStyleKey: function(props) {
      var style = getStyleFromProps(props, this.context.jsxstyleInheritableCssProperties);

      // Dirty the inheritableCssProperties cache
      this.inheritableCssProperties = null;
      this.styleKey = GlobalStylesheets.getKey(style);
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
