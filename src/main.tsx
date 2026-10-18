import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initSavedTheme} from './utils/themeEngine.ts';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';

initSavedTheme();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

