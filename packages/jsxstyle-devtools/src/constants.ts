import { EXPERIMENTAL_makeCustomProperties } from 'jsxstyle';

export const styleConstants = EXPERIMENTAL_makeCustomProperties({
  pageBackground: '#FFF',
  pageForeground: '#333',
})
  .addVariant('darkMode', {
    mediaQuery: 'screen and (prefers-color-scheme: dark)',
    pageBackground: '#333',
    pageForeground: '#FFF',
  })
  .build();
