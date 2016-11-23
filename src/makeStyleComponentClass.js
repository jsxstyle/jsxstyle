'use strict';

var GlobalStylesheets = require('./GlobalStylesheets');
var React = require('react');

var assign = require('object-assign');
var hyphenateStyleName = require('fbjs/lib/hyphenateStyleName');

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

function extractLocalStyles(styles) {
  if (styles.willChange) {
    const localStyles = {};
    const globalStyles = {};

    Object.entries(styles).forEach(
      ([key, value]) => {
        if (key === 'willChange') {
          let willChange = value;

          if (willChange.includes(',')) {
            willChange = willChange.split(',').map(
              untrimmed => untrimmed.trim()
            );
          }

          globalStyles[key] = willChange.map(
            styleName => hyphenateStyleName(styleName)
          ).join(', ');

        } else if (styles.willChange.includes(key)) {
          localStyles[key] = value;

        } else {
          globalStyles[key] = value;
        }
      }
    );

    return {
      localStyles,
      globalStyles,
    };

  } else {
    return {
      globalStyles: styles,
    }
  }
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

      const {
        localStyles,
        globalStyles,
      } = extractLocalStyles(
        getStyleFromProps(props)
      );

      this.styleKey = GlobalStylesheets.getKey(globalStyles, displayName, this.component);
      if (this.styleKey) {
        GlobalStylesheets.ref(this.styleKey);
      }

      const newState = {
        localStyles
      };

      if (this.state) {
        this.setState(newState);
      } else {
        this.state = newState;
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
      const {
        localStyles,
      } = this.state;

      var className = this.styleKey ? GlobalStylesheets.getClassName(this.styleKey) : null;

      return React.createElement(
        this.component,
        assign({
          className: (className || this.props.className) ? ((this.props.className || '') + ' ' + (className || '')) : null,
          children: this.props.children,
          style: localStyles,
        }, this.props.props)
      );
    }
  });

  return Style;
}

module.exports = makeStyleComponentClass;
