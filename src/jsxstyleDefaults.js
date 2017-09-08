'use strict';

module.exports = {
  // completely unstyled component
  Box: null,

  // display components
  Block: { display: 'block' },
  InlineBlock: { display: 'inline-block' },
  InlineFlex: { display: 'inline-flex' },
  Table: { display: 'table' },
  TableRow: { display: 'table-row' },
  TableCell: { display: 'table-cell' },
  Inline: { display: 'inline' },

  // flexbox helper components
  Row: { display: 'flex', flexDirection: 'row' },
  Col: { display: 'flex', flexDirection: 'column' },

  Grid: { display: 'grid' },
};
