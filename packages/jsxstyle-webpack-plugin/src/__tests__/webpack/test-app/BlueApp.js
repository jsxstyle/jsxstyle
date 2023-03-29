import { Inline } from 'jsxstyle';
import Shared from './Shared';
import { colorBlue } from './LayoutConstants';

export default function BlueApp() {
  return (
    <Shared>
      <Inline color={colorBlue}>Wow!</Inline>
    </Shared>
  );
}
