'use strict';

const GlobalStylesheets = require('./GlobalStylesheets');
const React = require('react');

function getStyleFromProps(props) {
  const style = {};

  for (const key in props) {
    if (key === 'children' || key === 'className' || key === 'component' || key === 'props' || key === 'style') {
      continue;
    }
    style[key] = props[key];
  }

  return style;
}

function makeStyleComponentClass(defaults, displayName, tagName) {
  tagName = tagName || 'div';
  displayName = displayName || 'Style';

  const Style = React.createClass({
    displayName,

    propTypes: {
      children: React.PropTypes.node,
      className: React.PropTypes.string,
      component: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object, React.PropTypes.func]),
      props: React.PropTypes.object,
      style: React.PropTypes.object,
    },

    statics: {
      style: defaults,
    },

    getDefaultProps() {
      return defaults;
    },

    refStyleKey(props) {
      this.component = this.props.component || tagName;
      this.styleKey = GlobalStylesheets.getKey(getStyleFromProps(props), displayName, this.component);
      if (this.styleKey) {
        GlobalStylesheets.ref(this.styleKey);
      }
    },

    componentWillMount() {
      this.refStyleKey(this.props);
    },

    componentWillReceiveProps(nextProps) {
      if (this.styleKey) {
        GlobalStylesheets.unref(this.styleKey);
      }
      this.refStyleKey(nextProps);
    },

    componentWillUnmount() {
      if (this.styleKey) {
        GlobalStylesheets.unref(this.styleKey);
      }
    },

    render() {
      const className = this.styleKey ? GlobalStylesheets.getClassName(this.styleKey) : null;

      return React.createElement(
        this.component,
        Object.assign({}, this.props.props, {
          className: className || this.props.className
            ? (this.props.className || '') + (this.props.className ? ' ' : '') + (className || '')
            : null,
          children: this.props.children,
          style: this.props.style,
        })
      );
    },
  });

  return Style;
}

module.exports = makeStyleComponentClass;
