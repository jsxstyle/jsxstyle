'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const invariant = require('invariant');

const getClassNameStringFromProps = require('./getClassNameStringFromProps');

function makeStyleComponentClass(defaultProps, displayName, tagName) {
  tagName = tagName || 'div';
  invariant(
    typeof displayName === 'string' && displayName !== '',
    'makeStyleComponentClass expects param 2 to be a valid displayName'
  );

  class Style extends React.Component {
    constructor(props) {
      super(props);
      this.component = props.component || tagName;
      this.className = getClassNameStringFromProps(props, props.className);
    }

    componentWillReceiveProps(nextProps) {
      this.component = nextProps.component || tagName;
      this.className = getClassNameStringFromProps(
        nextProps,
        nextProps.className
      );
    }

    render() {
      return React.createElement(
        this.component,
        Object.assign({}, this.props.props, {
          className: this.className,
          style: this.props.style,
        }),
        this.props.children
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

  Style.defaultProps = defaultProps;
  Style.displayName = displayName;

  return Style;
}

module.exports = makeStyleComponentClass;
