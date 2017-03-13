import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import {Block, install as installJsxstyle} from 'jsxstyle';

import Avatar from './Avatar';
import LayoutConstants from './LayoutConstants';

// install style reaper
installJsxstyle();

const reactRoot = document.getElementById('.jsxstyle-demo');

function load() {
  ReactDOM.render(
    <AppContainer>
      <Block
        marginLeft="auto"
        marginRight="auto"
        marginTop={128}
        border={`1px solid ${LayoutConstants.secondaryColor}`}
        font="12px -apple-system, BlinkMacSystemFont, sans-serif"
        width={48 * LayoutConstants.gridUnit}
        minHeight={64}>
        <Avatar username="metallica" />
        <Avatar username="justintimberlake" />
        <Avatar username="carlyraejepsen" />
      </Block>
    </AppContainer>,
    reactRoot
  );
}

if (module.hot) {
  module.hot.accept(load);
}

load();
