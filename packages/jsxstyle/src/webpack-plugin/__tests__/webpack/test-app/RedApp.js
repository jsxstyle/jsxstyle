import { Inline } from 'jsxstyle';
import Shared from './Shared';
import { colorRed } from './LayoutConstants';

export default function RedApp() {
  return (
    <Shared>
      <Inline color={colorRed}>Wow!</Inline>
    </Shared>
  );
}
