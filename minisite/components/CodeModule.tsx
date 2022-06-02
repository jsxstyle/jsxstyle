import { Col, Block } from 'jsxstyle';
import { ModuleHeading } from './ModuleHeading';

interface CodeModuleProps {
  title: string;
  code: string;
}

export const CodeModule: React.FC<CodeModuleProps> = ({ code, title }) => (
  <Col borderRadius={10} border="1px solid #AAA" overflow="hidden">
    <ModuleHeading>{title}</ModuleHeading>
    <Block
      padding={15}
      fontSize={16}
      lineHeight="20px"
      fontFamily="Menlo, Monaco, monospace"
      component="code"
    >
      <pre>{code}</pre>
    </Block>
  </Col>
);
