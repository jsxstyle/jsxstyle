import { Block } from '@jsxstyle/react';
declare const dynamic: boolean;
<Block color={dynamic ? 'red' : 'blue'} width={dynamic ? 200 : 400} />;
