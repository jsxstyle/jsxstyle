'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const invariant = require('invariant');

const { getClassName } = require('./styleCache');

function makeStyleComponentClass(displayName, defaultProps, tagName) {
  tagName = tagName || 'div';
  invariant(
    typeof displayName === 'string' && displayName !== '',
    'makeStyleComponentClass expects param 1 to be a valid displayName'
  );

  class Style extends React.Component {
    constructor(props) {
      super(props);
      this.component = props.component || tagName;
      this.className = getClassName(props, props.className);
    }

    componentWillReceiveProps(props) {
      this.component = props.component || tagName;
      this.className = getClassName(props, props.className);
    }

    render() {
      return (
        <this.component
          {...this.props.props}
          className={this.className}
          style={this.props.style}
        >
          {this.props.children}
        </this.component>
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
