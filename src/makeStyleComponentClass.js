'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const getClassNameStringFromProps = require('./getClassNameStringFromProps');

function makeStyleComponentClass(defaults, displayName, tagName) {
  tagName = tagName || 'div';
  displayName = displayName || 'Style';

  class Style extends React.Component {
    constructor(props) {
      super(props);
      this.component = props.component || tagName;
      this.className = getClassNameStringFromProps(props);
    }

    componentWillReceiveProps(nextProps) {
      this.component = nextProps.component || tagName;
      this.className = getClassNameStringFromProps(nextProps);
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

  Style.defaultProps = defaults;
  Style.displayName = displayName;

  return Style;
}

module.exports = makeStyleComponentClass;
