import { Block, useMatchMedia, makeCustomProperties } from 'jsxstyle';

const styleProps = makeCustomProperties({
  foreground: 'black',
  background: 'white',
})
  .addVariant('darkMode', {
    mediaQuery: 'screen and (prefers-color-scheme: dark)',
    foreground: 'white',
    background: 'black',
  })
  .build();

export default function ExampleComponent() {
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');
  return (
    <Block
      padding={20}
      color={styleProps.foreground}
      backgroundColor={styleProps.background}
    >
      Dark mode is{isDarkMode ? '' : ' not'} active {isDarkMode ? '🌃' : '🌅'}
    </Block>
  );
}
