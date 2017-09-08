import factory from './makePreactStyleComponentClass';
import { _defaults as defaults } from 'jsxstyle';

// default components
export const Box = factory('Box');
export const Block = factory('Block', defaults.Block);
export const InlineBlock = factory('InlineBlock', defaults.InlineBlock);
export const InlineFlex = factory('InlineFlex', defaults.InlineFlex);
export const Table = factory('Table', defaults.Table);
export const TableRow = factory('TableRow', defaults.TableRow);
export const TableCell = factory('TableCell', defaults.TableCell);
export const Inline = factory('Inline', defaults.Inline);
export const Row = factory('Row', defaults.Row);
export const Col = factory('Col', defaults.Col);
export const Grid = factory('Grid', defaults.Grid);
