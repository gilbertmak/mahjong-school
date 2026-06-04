import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import '../app.js';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

function App() {
  return null;
}

const root = document.getElementById('react-root');
if (root) {
  createRoot(root).render(React.createElement(React.StrictMode, null, React.createElement(App)));
}
