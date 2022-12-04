import { Col, Block } from 'jsxstyle';
import { styleConstants } from '../utilities/constants';

interface CodeModuleProps {
  title: string;
  code: string;
}

export const CodeModule: React.FC<CodeModuleProps> = ({ code, title }) => {
  return (
    <Col
      backgroundColor={styleConstants.background}
      border="1px solid"
      borderColor={styleConstants.border}
      borderRadius={10}
      color={styleConstants.foreground}
      overflow="hidden"
    >
      <Block
        flex="0 0 auto"
        height={30}
        lineHeight="30px"
        backgroundColor={styleConstants.insetBackground}
        paddingH={10}
        borderBottom="1px solid"
        borderBottomColor={styleConstants.insetBorder}
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
