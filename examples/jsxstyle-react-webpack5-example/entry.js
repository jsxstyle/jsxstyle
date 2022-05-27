import ReactDOM from 'react-dom';

import App from './App';

import './style.css';

const appRoot = document.getElementById('.jsxstyle-demo');

function load() {
  ReactDOM.render(<App />, appRoot);
}

if (module.hot) {
  module.hot.accept('./App', load);
}

load();
