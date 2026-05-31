import { Block, useMatchMedia } from '@jsxstyle/react';
import React from 'react';
export const MyComponent = () => {
  const matchesMQ = useMatchMedia('screen and (min-width: 600px)');
  return <Block paddingH={matchesMQ ? 20 : 10} />;
};
