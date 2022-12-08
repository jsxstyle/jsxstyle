import { Block, Box, useMatchMedia } from 'jsxstyle';
import { MonacoEditor } from './MonacoEditor';
import { CodePreview } from './CodePreview';
import { useState } from 'react';
import { styleConstants } from '../utilities/constants';

export const LiveEditor: React.FC = () => {
  const isSmallScreen = useMatchMedia('screen and (max-width: 1000px)');
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');
  const [code, setCode] =
    useState(`import { Block, useMatchMedia, EXPERIMENTAL_makeCustomProperties } from 'jsxstyle';

const styleProps = EXPERIMENTAL_makeCustomProperties({
  foreground: 'black',
  background: 'white',
}).addVariant('darkMode', {
  mediaQuery: 'screen and (prefers-color-scheme: dark)',
  foreground: 'white',
  background: 'black',
}).build();

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

// jsxstyle custom properties objects should be reset in a hot-reloading environment.
// Webpack example: \`module.hot.dispose(styleProps.reset);\`
export const dispose = () => styleProps.reset();
`);

  return (
    <Box
      display="flex"
      flexDirection={isSmallScreen ? 'column-reverse' : 'row'}
      height="100vh"
      alignItems="stretch"
    >
      <MonacoEditor
        flex="1 1 300px"
        theme={isDarkMode ? 'vs-dark' : 'vs-light'}
        backgroundColor={styleConstants.editorBackground}
        value={code}
        onChange={setCode}
      />

      <Block flex="1 1 300px" backgroundColor="#EEE" overflowX="scroll">
        <CodePreview code={code} />
      </Block>
    </Box>
  );
};
