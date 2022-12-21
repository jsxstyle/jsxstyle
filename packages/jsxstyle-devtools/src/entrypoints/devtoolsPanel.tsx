import { createRoot } from 'react-dom/client';
import { DevToolsPanel } from '../components/DevToolsPanel';
import '../style.css';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById('.jsxstyle-devtools')!;

const root = createRoot(container);
root.render(<DevToolsPanel />);
