import { Block, makeCustomProperties, useMatchMedia } from '@jsxstyle/react';

const customProperties = makeCustomProperties({
  foreground: 'black',
  background: 'white',
})
  .addVariant('darkMode', {
    mediaQuery: 'screen and (prefers-color-scheme: dark)',
    foreground: 'white',
    background: 'black',
  })
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
