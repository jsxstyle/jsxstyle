'use strict';

const React = require('react');
const getStyleObjectFromProps = require('./getStyleObjectFromProps');
const getStyleKeyForStyleObject = require('./getStyleKeyForStyleObject');
const getClassName = require('./getClassName');
const {refKey, unrefKey} = require('./styleCache');
const PropTypes = require('prop-types');

function makeStyleComponentClass(defaults, displayName, tagName) {
  tagName = tagName || 'div';
  displayName = displayName || 'Style';

  class Style extends React.Component {
    constructor(props) {
      super(props);
      const styleProps = getStyleObjectFromProps(props);
      this.styleKey = getStyleKeyForStyleObject(styleProps);
      this.component = this.props.component || tagName;
      if (this.styleKey) {
        refKey(this.styleKey, styleProps);
      }
    }

    componentWillReceiveProps(nextProps) {
      const oldStyleKey = this.styleKey;
      const nextStyleProps = getStyleObjectFromProps(nextProps);
      this.styleKey = getStyleKeyForStyleObject(nextStyleProps);
      this.component = nextProps.component || tagName;

      // skip ref/unref if style key changed
      if (this.styleKey === oldStyleKey) {
        return;
      }

      if (oldStyleKey) {
        unrefKey(oldStyleKey);
      }

      if (this.styleKey) {
        refKey(this.styleKey, nextStyleProps);
      }
    }

    componentWillUnmount() {
      if (this.styleKey) {
        unrefKey(this.styleKey);
      }
    }

    render() {
      const className = this.styleKey ? getClassName(this.styleKey) : null;

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
    }
  }

  Style.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    component: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.func]),
    props: PropTypes.object,
    style: PropTypes.object,
  };

  Style.defaultProps = defaults;
  Style.displayName = displayName;

  return Style;
}

module.exports = makeStyleComponentClass;
