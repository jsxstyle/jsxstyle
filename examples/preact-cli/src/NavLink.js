import { Link } from 'preact-router/match';
import { InlineBlock } from 'jsxstyle/preact';
import style from './style';

export default function NavLink({ href, children }) {
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
}
