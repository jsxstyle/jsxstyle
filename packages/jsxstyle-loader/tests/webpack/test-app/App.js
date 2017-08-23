import React from 'react';
import { Block } from 'jsxstyle';

const fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';

export default function App() {
  return (
    <Block color="red" fontFamily={fontFamily} fontSize={18} lineHeight="22px">
      Wow!
    </Block>
  );
}
