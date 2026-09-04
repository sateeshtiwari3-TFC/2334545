import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence benign Vite/WebSocket HMR errors and transient Recharts zero-dimension warnings
if (typeof window !== 'undefined') {
  const isBenignError = (msg: string) => {
    return (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('vite') || 
      msg.includes('HMR') || 
      msg.includes('closed without opened') ||
      (msg.includes('The width(') && msg.includes('of chart should be greater than 0'))
    );
  };

  const isRechartsDimensionWarning = (...args: any[]) => {
    const combined = args.map(arg => (typeof arg === 'string' ? arg : arg?.message || JSON.stringify(arg) || '')).join(' ');
    return combined.includes('The width(') && combined.includes('of chart should be greater than 0');
  };

  // Filter out transient Recharts ResizeObserver 0-dimension warnings on initial load
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (isRechartsDimensionWarning(...args)) {
      return; // Benign transient initial layout calculation
    }
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (isRechartsDimensionWarning(...args)) {
      return; // Benign transient initial layout calculation
    }
    originalError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (isBenignError(msg)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, { capture: true });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (isBenignError(msg)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, { capture: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
