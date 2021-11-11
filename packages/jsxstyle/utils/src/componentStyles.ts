import type { CSSProperties } from './types';

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

export const componentStyles: Record<
  JsxstyleComponentName,
  Pick<CSSProperties, 'display' | 'flexDirection'> | null
> = {
  Block: { display: 'block' },
  Box: null,
  Col: { display: 'flex', flexDirection: 'column' },
  Grid: { display: 'grid' },
  Inline: { display: 'inline' },
  InlineBlock: { display: 'inline-block' },
  InlineCol: { display: 'inline-flex', flexDirection: 'column' },
  InlineRow: { display: 'inline-flex', flexDirection: 'row' },
  Row: { display: 'flex', flexDirection: 'row' },
};
