import { Block, Row } from '@jsxstyle/react';

export default function Page() {
  return (
    <Row>
      <Block color="red" fontSize={16}>
        Hello
      </Block>
      <Block backgroundColor="blue" padding={8}>
        World
      </Block>
    </Row>
  );
}
