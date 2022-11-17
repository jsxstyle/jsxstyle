import ReactDOM from 'react-dom';
import BlueApp from './BlueApp';

if (typeof document !== 'undefined') {
  const reactRoot = document.getElementById('.jsxstyle-demo');
  ReactDOM.render(<BlueApp />, reactRoot);

  if (module.hot) {
    module.hot.accept('./BlueApp', () => {
      ReactDOM.render(<BlueApp />, reactRoot);
    });
  }
}
