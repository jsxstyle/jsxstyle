import * as ReactDOMClient from 'react-dom/client';
import App from './App';
import './index.css';

// oxlint-disable-next-line typescript/no-non-null-assertion -- its ok
const appRoot = document.getElementById('.jsxstyle-demo')!;
const root = ReactDOMClient.createRoot(appRoot);
root.render(<App />);
