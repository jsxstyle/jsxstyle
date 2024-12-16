import { Inline } from '@jsxstyle/react';
import { colorBlue } from './LayoutConstants';
import Shared from './Shared';

export default function BlueApp() {
  return (
    <Shared>
      <Inline color={colorBlue}>Wow!</Inline>
    </Shared>
  );
}
