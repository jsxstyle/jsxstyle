import React from 'react';
import { Block } from './index';

export function install() {
  console.error(
    'jsxstyle\u2019s `install` method is no longer required and will be removed in jsxstyle 2.0.'
  );
}

function factory(displayName, defaultProps) {
  let hasWarned = false;
  return class extends React.Component {
    static displayName = displayName;
    static defaultProps = defaultProps;

    componentWillMount() {
      if (process.env.NODE_ENV !== 'production') {
        if (!hasWarned) {
          hasWarned = true;
          console.error(
            'jsxstyle\u2019s `' +
              displayName +
              '` component is deprecated and will be removed in ' +
              'future versions of jsxstyle.'
          );
        }
      }
    }

    render() {
      return <Block {...this.props} />;
    }
  };
}

// <Box component="table" />
export const Table = factory('Table', { display: 'table' });
export const TableRow = factory('TableRow', { display: 'table-row' });
export const TableCell = factory('TableCell', { display: 'table-cell' });
// <Row display="inline-flex" />
export const Flex = factory('Flex', { display: 'flex' });
export const InlineFlex = factory('InlineFlex', { display: 'inline-flex' });
