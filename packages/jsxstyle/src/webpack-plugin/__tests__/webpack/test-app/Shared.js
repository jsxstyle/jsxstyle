import { Block } from 'jsxstyle';
import { fontStyle } from './LayoutConstants';

const fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';

export default function Shared({ children }) {
  return (
    <Block fontFamily={fontFamily} {...fontStyle}>
      {children}
    </Block>
  );
}
