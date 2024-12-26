import { Block, useMatchMedia } from '@jsxstyle/react';
import { makeCustomProperties } from '@jsxstyle/core';

const customProperties = makeCustomProperties({
  colorScheme: 'light',
  foreground: 'black',
  background: 'white',
})
  .addVariant(
    'darkMode',
    {
      colorScheme: 'dark',
      foreground: 'white',
      background: 'black',
    },
    {
      mediaQuery: 'screen and (prefers-color-scheme: dark)',
    }
  )
  .build();

export { customProperties };

export default function ExampleComponent() {
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');
  return (
    <Block
      padding={20}
      color={customProperties.foreground}
      backgroundColor={customProperties.background}
    >
      Dark mode is{isDarkMode ? '' : ' not'} active {isDarkMode ? '🌃' : '🌅'}
    </Block>
  );
}
