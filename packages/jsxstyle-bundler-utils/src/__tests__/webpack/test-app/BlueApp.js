import { Inline } from 'jsxstyle';
import { colorBlue } from './LayoutConstants';
import Shared from './Shared';

export default function BlueApp() {
  return (
    <Shared>
      <Inline color={colorBlue}>Wow!</Inline>
    </Shared>
  );
}
