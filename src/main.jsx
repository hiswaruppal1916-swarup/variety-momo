import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Register unified PWA / Firebase Messaging Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const registerWorker = () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      .then((reg) => {
        // SW registered successfully
        if (reg && reg.update) {
          reg.update().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration skipped:', err);
      });
  };

  if (document.readyState === 'complete') {
    registerWorker();
  } else {
    window.addEventListener('load', registerWorker);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
