import * as React from 'react';
import { componentStyles, getStyleCache } from 'jsxstyle-utils';

export const cache = getStyleCache();

function factory(displayName, defaultProps, tagName) {
  tagName = tagName || 'div';
  if (typeof displayName !== 'string' || !displayName) {
    throw new Error(
      'makeReactStyleComponentClass expects param 1 to be a valid displayName'
    );
  }

  return class extends React.Component {
    constructor(props) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.className);
    }

    static defaultProps = defaultProps;
    static displayName = displayName;

    componentWillReceiveProps(props) {
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.className);
    }

    render() {
      const { props, style, children } = this.props;
      return (
        <this.component {...props} className={this.className} style={style}>
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

export function install() {
  console.error(
    'jsxstyle\u2019s `install` method is no longer required and will be removed in jsxstyle 2.0.'
  );
}

function depFactory(displayName, defaultProps) {
  let hasWarned = false;
  return class extends React.Component {
    static displayName = displayName;
    static defaultProps = defaultProps;

    componentWillMount() {
      if (process.env.NODE_ENV !== 'production') {
        if (!hasWarned) {
          hasWarned = true;
          console.error(
            'jsxstyle\u2019s `%s` component is deprecated and will be removed in future versions of jsxstyle.',
            displayName
          );
        }
      }
    }

    render() {
      return <Box {...this.props} />;
    }
  };
}

// <Box component="table" />
export const Table = depFactory('Table', { display: 'table' });
export const TableRow = depFactory('TableRow', { display: 'table-row' });
export const TableCell = depFactory('TableCell', { display: 'table-cell' });
// <Row display="inline-flex" />
export const Flex = depFactory('Flex', { display: 'flex' });
export const InlineFlex = depFactory('InlineFlex', { display: 'inline-flex' });
