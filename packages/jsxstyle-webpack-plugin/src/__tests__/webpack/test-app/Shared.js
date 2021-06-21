import React from 'react';
import { Block } from 'jsxstyle';

const fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';

export default function Shared({ children }) {
  return (
    <Block fontFamily={fontFamily} fontSize={18} lineHeight="22px">
      {children}
    </Block>
  );
}
