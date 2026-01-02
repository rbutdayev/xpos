import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './renderer/App';
import './index.css';

// Import mock IPC for development (browser mode)
import './utils/mock-ipc';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
