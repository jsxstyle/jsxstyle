type CSSProperties = import('./types').CSSProperties;

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

export type DeprecatedJsxstyleComponentName =
  | 'Flex'
  | 'InlineFlex'
  | 'Table'
  | 'TableCell'
  | 'TableRow';

export const componentStyles: Record<
  JsxstyleComponentName | DeprecatedJsxstyleComponentName,
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

  // deprecated
  Flex: { display: 'flex' },
  InlineFlex: { display: 'inline-flex' },
  Table: { display: 'table' },
  TableCell: { display: 'table-cell' },
  TableRow: { display: 'table-row' },
};
