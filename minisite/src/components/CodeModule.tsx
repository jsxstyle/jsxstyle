import { Block, Col } from '@jsxstyle/react';
import { styleConstants } from '../utilities/constants';

interface CodeModuleProps {
  title: string;
  code: string;
}

export const CodeModule: React.FC<CodeModuleProps> = ({ code, title }) => {
  return (
    <Col
      backgroundColor={styleConstants.color.background}
      border="1px solid"
      borderColor={styleConstants.color.border}
      borderRadius={10}
      color={styleConstants.color.foreground}
      overflow="hidden"
    >
      <Block
        flex="0 0 auto"
        height={30}
        lineHeight="30px"
        backgroundColor={styleConstants.color.insetBackground}
        paddingH={10}
        borderBottom="1px solid"
        borderBottomColor={styleConstants.color.border}
      >
        {title}
      </Block>
      <Block
        padding={15}
        fontSize={16}
        lineHeight="20px"
        fontFamily="Menlo, Monaco, monospace"
        component="code"
        whiteSpace="nowrap"
        overflowY="scroll"
      >
        <pre>{code}</pre>
      </Block>
    </Col>
  );
};
