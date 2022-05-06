import { Block } from 'jsxstyle';

import Avatar from './Avatar';
import LayoutConstants from './LayoutConstants';

import './style.css';

export default function App() {
  return (
    <Block
      marginLeft="auto"
      marginRight="auto"
      marginTop={128}
      border={`1px solid ${LayoutConstants.secondaryColor}`}
      width={48 * LayoutConstants.gridUnit}
      minHeight={64}
      borderRadius={8}
      padding={10}
    >
      <Avatar username="metallica" />
      <Avatar username="justintimberlake" />
      <Avatar username="carlyraejepsen" />
    </Block>
  );
}
