import { Block, Box, css, useMatchMedia } from 'jsxstyle';
import { MonacoEditor } from './MonacoEditor';
import { CodePreview } from './CodePreview';
import { useState } from 'react';
import { styleConstants } from '../utilities/constants';
import codeSample from '../codeSample?raw';

export const LiveEditor: React.FC = () => {
  const isSmallScreen = useMatchMedia('screen and (max-width: 1000px)');
  const [code, setCode] = useState(codeSample);

  return (
    <Box
      display="flex"
      flexDirection={isSmallScreen ? 'column-reverse' : 'row'}
      height="100vh"
      alignItems="stretch"
    >
      <MonacoEditor
        value={code}
        onChange={setCode}
        className={css({
          height: '100%',
          width: '100%',
          flex: '1 1 300px',
          backgroundColor: styleConstants.editorBackground,
        })}
      />

      <Block flex="1 1 300px" backgroundColor="#EEE" overflowX="scroll">
        <CodePreview code={code} />
      </Block>
    </Box>
  );
};
