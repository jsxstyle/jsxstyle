import ReactDOM from 'react-dom';
import RedApp from './RedApp';

if (typeof document !== 'undefined') {
  const reactRoot = document.getElementById('.jsxstyle-demo');
  ReactDOM.render(<RedApp />, reactRoot);

  if (module.hot) {
    module.hot.accept('./RedApp', () => {
      ReactDOM.render(<RedApp />, reactRoot);
    });
  }
}
