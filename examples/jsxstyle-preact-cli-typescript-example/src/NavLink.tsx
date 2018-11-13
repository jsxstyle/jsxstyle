import { InlineBlock } from 'jsxstyle/preact';
import { ComponentChildren, FunctionalComponent, h } from 'preact';
import { Link } from 'preact-router/match';

import * as style from './style.css';

interface NavLinkProps {
  href: string;
  children?: ComponentChildren;
}

const NavLink: FunctionalComponent<NavLinkProps> = ({
  href,
  children,
}: NavLinkProps) => {
  return (
    <InlineBlock
      component={Link}
      props={{
        activeClassName: style.active,
        href,
      }}
      height={56}
      lineHeight="56px"
      padding="0 15px"
      minWidth={50}
      textAlign="center"
      background="rgba(255,255,255,0)"
      textDecoration="none"
      color="#FFF"
      willChange="background-color"
      hoverBackground="rgba(0,0,0,0.2)"
      activeBackground="rgba(0,0,0,0.2)"
    >
      {children}
    </InlineBlock>
  );
};

export default NavLink;
