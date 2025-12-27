
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';
// Import Prism theme directly from node_modules
import 'prismjs/themes/prism-tomorrow.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
