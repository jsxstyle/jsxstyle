import factory from './makePreactStyleComponentClass';
import { _defaults as defaults } from 'jsxstyle';

export { injectAddRule, injectClassNameStrategy, resetCache } from 'jsxstyle';

// default components
export const Box = factory('Box');
export const Block = factory('Block', defaults.Block);
export const Inline = factory('Inline', defaults.Inline);
export const InlineBlock = factory('InlineBlock', defaults.InlineBlock);
export const Row = factory('Row', defaults.Row);
export const Col = factory('Col', defaults.Col);
export const Grid = factory('Grid', defaults.Grid);
