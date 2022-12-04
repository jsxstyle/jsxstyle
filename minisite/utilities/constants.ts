import { EXPERIMENTAL_makeCustomProperties } from 'jsxstyle';

export const styleConstants = EXPERIMENTAL_makeCustomProperties({
  foreground: '#333',
  background: '#FFF',
  border: '#EEE',
  editorBackground: '#AAA',
  insetBackground: '#DDD',
  insetBorder: '#BBB',
})
  .addVariant('darkMode', {
    mediaQuery: 'screen and (prefers-color-scheme: dark)',
    foreground: '#FFF',
    background: '#000',
    border: '#111',
    editorBackground: '#1e1e1e',
    insetBackground: '#000',
    insetBorder: '#222',
  })
  .build();

module.hot?.dispose(styleConstants.reset);
