import type { JsxstyleComponentStyleProps } from './types.js';

export type JsxstyleComponentName =
  | 'Block'
  | 'Box'
  | 'Col'
  | 'Grid'
  | 'Inline'
  | 'InlineBlock'
  | 'InlineCol'
  | 'InlineRow'
  | 'Row';

export const componentStyles = {
  Block: { display: 'block' },
  Box: null,
  Col: { display: 'flex', flexDirection: 'column' },
  Grid: { display: 'grid' },
  Inline: { display: 'inline' },
  InlineBlock: { display: 'inline-block' },
  InlineCol: { display: 'inline-flex', flexDirection: 'column' },
  InlineRow: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  Row: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
} satisfies Record<JsxstyleComponentName, JsxstyleComponentStyleProps | null>;
