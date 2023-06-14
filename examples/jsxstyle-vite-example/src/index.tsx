import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

const element = document.getElementById('.jsxstyle-demo') as HTMLElement;
const root = createRoot(element);
root.render(<App />);
