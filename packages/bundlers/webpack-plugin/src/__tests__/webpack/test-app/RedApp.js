import { Inline } from '@jsxstyle/react';
import { colorRed } from './LayoutConstants';
import Shared from './Shared';

export default function RedApp() {
  return (
    <Shared>
      <Inline color={colorRed}>Wow!</Inline>
    </Shared>
  );
}
