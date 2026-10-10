import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSavedTheme } from './utils/themeEngine';
import { ErrorBoundary } from './components/ErrorBoundary';

// Apply saved theme color and font presets immediately on boot
initSavedTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
