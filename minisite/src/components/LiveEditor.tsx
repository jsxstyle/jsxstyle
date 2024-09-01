import { Block, Box, css, useMatchMedia } from 'jsxstyle';
import { useState } from 'react';
import codeSample from '../codeSample?raw';
import { styleConstants } from '../utilities/constants';
import { CodePreview } from './CodePreview';
import { MonacoEditor } from './MonacoEditor';

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
