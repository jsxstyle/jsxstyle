'use strict';

const React = require('react');
const getStyleKeysForProps = require('./getStyleKeysForProps');
const getClassName = require('./getClassName');
const { refClassName, unrefClassName } = require('./styleCache');
const PropTypes = require('prop-types');

function makeStyleComponentClass(defaults, displayName, tagName) {
  tagName = tagName || 'div';
  displayName = displayName || 'Style';

  class Style extends React.Component {
    constructor(props) {
      super(props);
      this.updateRefs = this.updateRefs.bind(this);
      this.updateRefs(props);
    }

    updateRefs(nextProps) {
      const oldClassNames = this.classNameObject;
      this.classNameObject = {};

      this.component = nextProps.component || tagName;
      this.classNameString = null;

      const styleObj = getStyleKeysForProps(nextProps);
      if (styleObj) {
        for (const keyPrefix in styleObj) {
          const value = styleObj[keyPrefix];
          const key = keyPrefix + value.css;
          const classNamePrefix =
            '_' +
            // if it's a prefixed prop, use special classname prefix
            (value.mediaQuery || value.pseudoclass
              ? (value.mediaQuery ? 'm' : '') + (value.pseudoclass ? 'p' : '')
              : 'j');

          const className = getClassName(key, classNamePrefix);
          if (!this.classNameString) {
            this.classNameString = className;
          } else {
            this.classNameString += ' ' + className;
          }

          this.classNameObject[className] = true;
          // skip ref/unref of old style key
          if (oldClassNames && oldClassNames.hasOwnProperty(className)) {
            delete oldClassNames[className];
            continue;
          }
          refClassName(className, value);
        }
      }

      if (oldClassNames) {
        for (const className in oldClassNames) {
          unrefClassName(className);
        }
      }
    }

    componentWillReceiveProps(nextProps) {
      this.updateRefs(nextProps);
    }

    componentWillUnmount() {
      if (this.classNameObject) {
        for (const className in this.classNameObject) {
          unrefClassName(className);
        }
      }
    }

    render() {
      return React.createElement(
        this.component,
        Object.assign({}, this.props.props, {
          className:
            this.classNameString && this.props.className
              ? this.props.className + ' ' + this.classNameString
              : this.classNameString || this.props.className
                ? this.classNameString || this.props.className
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
    component: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
      PropTypes.func,
    ]),
    mediaQueries: PropTypes.object,
    props: PropTypes.object,
    style: PropTypes.object,
  };

  Style.defaultProps = defaults;
  Style.displayName = displayName;

  return Style;
}

module.exports = makeStyleComponentClass;
