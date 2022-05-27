import * as ReactDOM from 'react-dom';

import App from './App';
import './index.css';

const appRoot = document.getElementById('.jsxstyle-demo') as HTMLElement;

function load() {
  ReactDOM.render(<App />, appRoot);
}

if (module.hot) {
  module.hot.accept('./App', load);
}

load();
