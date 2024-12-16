import { css, makeCustomProperties } from '@jsxstyle/react';

export const exampleClassName = css({
  display: 'block',
  textAlign: 'center',
});

export const styleConstants = makeCustomProperties({
  foreground: '#FFF',
  background: '#000',
})
  .addVariant('darkMode', {
    mediaQuery: 'screen and (prefers-color-scheme: dark)',
    foreground: '#FFF',
    background: '#000',
  })
  .build();
