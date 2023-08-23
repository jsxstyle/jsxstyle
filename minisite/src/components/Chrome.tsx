import { Block } from 'jsxstyle';

interface ChromeProps {
  children?: React.ReactNode;
}

export const Chrome: React.FC<ChromeProps> = ({ children }) => {
  return <Block component="main">{children}</Block>;
};
