import { Block, useMatchMedia, makeCustomProperties } from '@jsxstyle/react';

const customProperties = makeCustomProperties(
  {
    foreground: 'black',
    background: 'white',
  },
  { colorScheme: 'light' }
)
  .addVariant(
    'darkMode',
    {
      foreground: 'white',
      background: 'black',
    },
    {
      colorScheme: 'dark',
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
