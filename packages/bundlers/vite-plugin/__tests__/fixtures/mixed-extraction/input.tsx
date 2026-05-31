import { Block } from '@jsxstyle/react';

declare const dynamicValue: string;

export default function App() {
  return (
    <Block color="red" fontSize={16}>
      <Block backgroundColor={dynamicValue}>dynamic</Block>
    </Block>
  );
}
