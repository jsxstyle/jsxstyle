import factory from './makePreactStyleComponentClass';
import { componentStyles } from 'jsxstyle-utils';

export const Box = factory('Box');
export const Block = factory('Block', componentStyles.Block);
export const Inline = factory('Inline', componentStyles.Inline);
export const InlineBlock = factory('InlineBlock', componentStyles.InlineBlock);
export const Row = factory('Row', componentStyles.Row);
export const Col = factory('Col', componentStyles.Col);
export const Grid = factory('Grid', componentStyles.Grid);

export { cache } from './makePreactStyleComponentClass';
