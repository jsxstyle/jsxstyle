import * as ReactDOMClient from 'react-dom/client';
import App from './App';
import './index.css';

// biome-ignore lint/style/noNonNullAssertion: its ok
const appRoot = document.getElementById('.jsxstyle-demo')!;
const root = ReactDOMClient.createRoot(appRoot);
root.render(<App />);
