import { makeCustomProperties } from '@jsxstyle/react';

export const styleConstants = makeCustomProperties({
  foreground: '#333',
  background: '#FFF',
  pageBackground: '#EEE',
  border: '#BBB',
  editorBackground: '#AAA',
  insetBackground: '#DDD',
})
  .addVariant('darkMode', {
    mediaQuery: 'screen and (prefers-color-scheme: dark)',
    foreground: '#FFF',
    background: '#222',
    pageBackground: '#333',
    border: '#666',
    editorBackground: '#1e1e1e',
    insetBackground: '#000',
  })
  .build();
