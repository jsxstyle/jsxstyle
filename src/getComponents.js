'use strict';

/**
 * Creates a default set of jsxstyle components with the given `factory`
 * @param {function} factory
 * @returns {object} set of jsxstyle components
 */
function getComponents(factory) {
  return {
    install() {
      // eslint-disable-next-line no-console
      console.error(
        'jsxstyle.install is no longer required and will be removed in jsxstyle 2.0'
      );
    },

    // completely unstyled component
    Box: factory('Box'),

    // display components
    Block: factory('Block', { display: 'block' }),
    Flex: factory('Flex', { display: 'flex' }),
    InlineBlock: factory('InlineBlock', { display: 'inline-block' }),
    InlineFlex: factory('InlineFlex', { display: 'inline-flex' }),
    Table: factory('Table', { display: 'table' }),
    TableRow: factory('TableRow', { display: 'table-row' }),
    TableCell: factory('TableCell', { display: 'table-cell' }),
    Inline: factory('Inline', { display: 'inline' }),

    // flexbox helper components
    Row: factory('Row', { display: 'flex', flexDirection: 'row' }),
    Col: factory('Col', { display: 'flex', flexDirection: 'column' }),

    Grid: factory('Grid', { display: 'grid' }),
  };
}

module.exports = getComponents;
