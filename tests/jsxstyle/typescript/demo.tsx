import * as React from 'react';
import { Block } from '../../../packages/jsxstyle';

const Div: React.SFC = props => <div {...props} />;

export const Demo1 = () => <Block component="input" props={{ value: 'wow' }} />;
export const Demo2 = () => <Block component={Div} props={{ title: 'wow' }} />;
