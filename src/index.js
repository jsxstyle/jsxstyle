'use strict';

const { installReaper } = require('./styleCache');
const makeStyleComponentClass = require('./makeStyleComponentClass');

// prettier-ignore
module.exports = {
  install: installReaper,

  // completely unstyled component
  Box: makeStyleComponentClass(undefined, 'Box'),

  // display components
  Block: makeStyleComponentClass({ display: 'block' }, 'Block'),
  Flex: makeStyleComponentClass({ display: 'flex' }, 'Flex'),
  InlineBlock: makeStyleComponentClass({ display: 'inline-block' }, 'InlineBlock'),
  InlineFlex: makeStyleComponentClass({ display: 'inline-flex' }, 'InlineFlex'),
  Table: makeStyleComponentClass({ display: 'table' }, 'Table'),
  TableRow: makeStyleComponentClass({ display: 'table-row' }, 'TableRow'),
  TableCell: makeStyleComponentClass({ display: 'table-cell' }, 'TableCell'),
  Inline: makeStyleComponentClass({ display: 'inline' }, 'Inline'),

  // flexbox helper components
  Row: makeStyleComponentClass({ display: 'flex', flexDirection: 'row' }, 'Row'),
  Col: makeStyleComponentClass({ display: 'flex', flexDirection: 'column' }, 'Col'),

  Grid: makeStyleComponentClass({ display: 'grid' }, 'Grid'),
};
