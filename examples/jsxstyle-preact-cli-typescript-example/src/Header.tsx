import { Block } from 'jsxstyle/preact';
import { Component, h } from 'preact';

import NavLink from './NavLink';

export default class Header extends Component<{}, {}> {
  public render() {
    return (
      <Block
        component="header"
        position="fixed"
        left={0}
        top={0}
        width="100%"
        height={56}
        padding={0}
        background="#673AB7"
        boxShadow="0 0 5px rgba(0, 0, 0, 0.5)"
        zIndex={50}
      >
        <Block
          component="h1"
          float="left"
          margin={0}
          padding="0 15px"
          fontSize={24}
          lineHeight="56px"
          fontWeight={400}
          color="#FFF"
        >
          Preact App
        </Block>
        <Block component="nav" float="right" fontSize="100%">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/profile">Me</NavLink>
          <NavLink href="/profile/john">John</NavLink>
        </Block>
      </Block>
    );
  }
}
