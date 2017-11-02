/** @jsx h */
import * as invariant from 'invariant';
import { getStyleCache, componentStyles } from 'jsxstyle-utils';
import { h, Component } from 'preact';

export const cache = getStyleCache();

function factory(displayName, defaultProps, tagName) {
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

    static defaultProps = defaultProps;
    static displayName = displayName;

    componentWillReceiveProps(props) {
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    render({ style, props, children }) {
      return (
        <this.component {...props} class={this.className} style={style}>
          {children}
        </this.component>
      );
    }
  };
}

export const Box = factory('Box');
export const Block = factory('Block', componentStyles.Block);
export const Inline = factory('Inline', componentStyles.Inline);
export const InlineBlock = factory('InlineBlock', componentStyles.InlineBlock);
export const Row = factory('Row', componentStyles.Row);
export const Col = factory('Col', componentStyles.Col);
export const Grid = factory('Grid', componentStyles.Grid);
