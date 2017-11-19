export interface StyleObject {
  [key: string]: { [key: string]: string | number } | null;
}

export default {
  Box: null,
  Block: { display: 'block' },
  Inline: { display: 'inline' },
  InlineBlock: { display: 'inline-block' },
  Row: { display: 'flex', flexDirection: 'row' },
  Col: { display: 'flex', flexDirection: 'column' },
  Grid: { display: 'grid' },
} as StyleObject;
