import { Block } from 'jsxstyle';

export const ModuleHeading: React.FC = ({ children }) => (
  <Block
    flex="0 0 auto"
    height={30}
    lineHeight="30px"
    backgroundColor="#DDD"
    paddingH={10}
    borderBottom="1px solid #BBB"
  >
    {children}
  </Block>
);
