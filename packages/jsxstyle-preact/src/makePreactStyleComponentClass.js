import invariant from 'invariant';
import PropTypes from 'prop-types';
import { getStyleCache } from 'jsxstyle-utils';
import { h, Component } from 'preact';

export const cache = getStyleCache();

export default function makePreactStyleComponentClass(
  displayName,
  defaultProps,
  tagName
) {
  tagName = tagName || 'div';
  invariant(
    typeof displayName === 'string' && displayName !== '',
    'makePreactStyleComponentClass expects param 1 to be a valid displayName'
  );

  return class extends Component {
    constructor(props) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    static propTypes = {
      class: PropTypes.string,
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
      this.className = cache.getClassName(props, props.class);
    }

    render({ style, props, children }) {
      return h(
        this.component,
        Object.assign({}, props, {
          class: this.className,
          style,
        }),
        children
      );
    }
  };
}
