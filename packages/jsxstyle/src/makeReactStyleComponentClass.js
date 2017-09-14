import PropTypes from 'prop-types';
import invariant from 'invariant';

import { createElement as h, Component } from 'react';

import { getClassName } from './styleCache';

export default function makeReactStyleComponentClass(
  displayName,
  defaultProps,
  tagName
) {
  tagName = tagName || 'div';
  invariant(
    typeof displayName === 'string' && displayName !== '',
    'makeReactStyleComponentClass expects param 1 to be a valid displayName'
  );

  return class extends Component {
    constructor(props) {
      super(props);
      this.component = props.component || tagName;
      this.className = getClassName(props, props.className);
    }

    propTypes = {
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

    static defaultProps = defaultProps;
    static displayName = displayName;

    componentWillReceiveProps(props) {
      this.component = props.component || tagName;
      this.className = getClassName(props, props.className);
    }

    render() {
      return h(
        this.component,
        Object.assign({}, this.props.props, {
          className: this.className,
          style: this.props.style,
        }),
        this.props.children
      );
    }
  };
}
