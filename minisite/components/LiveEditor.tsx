import { Block, Box, useMatchMedia } from 'jsxstyle';
import { MonacoEditor } from './MonacoEditor';
import { CodePreview } from './CodePreview';
import { useState } from 'react';

export const LiveEditor: React.FC = () => {
  const isSmallScreen = useMatchMedia('screen and (max-width: 1000px)');
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');
  const [code, setCode] =
    useState(`import { Block, useMatchMedia } from 'jsxstyle';

function ExampleComponent() {
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');
  return (
    <Block
      padding={20}
      color={isDarkMode ? 'white' : 'black'}
      backgroundColor={isDarkMode ? 'black' : 'white'}
    >
      Dark mode is{isDarkMode ? '' : ' not'} active {isDarkMode ? '🌃' : '🌅'}
    </Block>
  );
}

export default <ExampleComponent />;
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
        backgroundColor={isDarkMode ? '#1e1e1e' : '#AAA'}
        value={code}
        onChange={setCode}
      />

      <Block flex="1 1 300px" backgroundColor="#EEE" overflowX="scroll">
        <CodePreview code={code} />
      </Block>
    </Box>
  );
};
