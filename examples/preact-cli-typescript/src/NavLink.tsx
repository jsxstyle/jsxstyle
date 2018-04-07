import { h, FunctionalComponent } from 'preact';
import { Link } from 'preact-router/match';
import { InlineBlock } from 'jsxstyle/preact';
import * as style from './style.css';

interface NavLinkProps {
  href: string;
  children?: JSX.Element[];
}

const NavLink: FunctionalComponent<NavLinkProps> = ({
  href,
  children,
}: NavLinkProps) => {
  return (
    <InlineBlock
      component={Link}
      props={{
        href,
        activeClassName: style.active,
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
