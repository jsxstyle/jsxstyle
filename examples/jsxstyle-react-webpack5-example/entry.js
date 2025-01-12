import ReactDOMClient from 'react-dom/client';
import App from './App';
import './style.css';

const appRoot = document.getElementById('.jsxstyle-demo');
const root = ReactDOMClient.createRoot(appRoot);
root.render(<App />);
