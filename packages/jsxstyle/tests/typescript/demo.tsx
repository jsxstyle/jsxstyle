import { Block } from '../../';
import * as React from 'react';

const Div: React.SFC = props => <div {...props} />;

<Block component="input" props={{ value: 'wow' }} />;
<Block component={Div} props={{ title: 'wow' }} />;
