import * as React from 'react';
import { Block } from '../../../packages/jsxstyle';

const Div: React.SFC = props => <div {...props} />;

<Block component="input" props={{ value: 'wow' }} />;
<Block component={Div} props={{ title: 'wow' }} />;
