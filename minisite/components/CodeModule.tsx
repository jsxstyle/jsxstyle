import { Col, Block, useMatchMedia } from 'jsxstyle';

interface CodeModuleProps {
  title: string;
  code: string;
}

export const CodeModule: React.FC<CodeModuleProps> = ({ code, title }) => {
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');

  return (
    <Col
      backgroundColor={isDarkMode ? '#111' : '#EEE'}
      border="1px solid"
      borderColor={isDarkMode ? '#333' : '#AAA'}
      borderRadius={10}
      color={isDarkMode ? '#FFF' : '#000'}
      overflow="hidden"
    >
      <Block
        flex="0 0 auto"
        height={30}
        lineHeight="30px"
        backgroundColor={isDarkMode ? '#000' : '#DDD'}
        paddingH={10}
        borderBottom="1px solid"
        borderBottomColor={isDarkMode ? '#222' : '#BBB'}
      >
        {title}
      </Block>
      <Block
        padding={15}
        fontSize={16}
        lineHeight="20px"
        fontFamily="Menlo, Monaco, monospace"
        component="code"
        whiteSpace="pre-wrap"
      >
        {code}
      </Block>
    </Col>
  );
};
