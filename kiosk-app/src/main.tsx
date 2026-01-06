import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './renderer/App';
import './index.css'; // Tailwind CSS
import './i18n/config'; // Initialize i18n

// Only import mock IPC if window.ipc doesn't exist (development in browser)
if (typeof window.ipc === 'undefined') {
  import('./utils/mock-ipc');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('main.tsx: Root element not found!');
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
