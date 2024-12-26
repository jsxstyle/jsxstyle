import { css, makeCustomProperties } from '@jsxstyle/core';

export const exampleClassName = css({
  display: 'block',
  textAlign: 'center',
});

export const styleConstants = makeCustomProperties({
  foreground: '#FFF',
  background: '#000',
})
  .addVariant(
    'darkMode',
    {
      foreground: '#FFF',
      background: '#000',
    },
    {
      mediaQuery: 'screen and (prefers-color-scheme: dark)',
    }
  )
  .build();
