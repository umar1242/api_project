import React from 'react';
import ReactDOM from 'react-dom/client';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import App from './App';
import './index.css';

// Initialize Telegram WebApp SDK immediately before mounting React
try {
  WebApp.ready();
  WebApp.expand();
} catch (err) {
  console.warn('WebApp initialization warning:', err);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
