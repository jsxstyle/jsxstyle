import { Block, useMatchMedia } from '@jsxstyle/react';
import React from 'react';
export const MyComponent = () => {
  const matchesMQ = useMatchMedia('matchMedia media query');
  return (
    <Block
      color={matchesMQ ? 'red' : 'blue'}
      fontFamily={matchesMQ ? 'serif' : 'sans-serif'}
    />
  );
};
