import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

if (typeof document !== 'undefined') {
  const reactRoot = document.getElementById('.jsxstyle-demo');
  ReactDOM.render(<App />, reactRoot);

  if (module.hot) {
    module.hot.accept('./App', () => {
      ReactDOM.render(<App />, reactRoot);
    });
  }
}
