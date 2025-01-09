/** @jsxImportSource solid-js */
import { Block, InlineBlock, Row } from '@jsxstyle/solid';

export const SolidExample = () => {
  return (
    <Row>
      <Block
        component="a"
        href="#wow"
        id="jsxstyle-test"
        color="blue"
        placeholderColor="red"
        hoverColor="orange"
        activeColor="purple"
        // @ts-expect-error untyped style prop
        activePlaceholderColor="cyan"
        flex={1}
        width={2 / 3}
        maxWidth={600}
      >
        <InlineBlock>Neat!</InlineBlock>
      </Block>
    </Row>
  );
};
