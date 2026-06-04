import React from 'react';
import { createRoot } from 'react-dom/client';
import './app.js';

function App() {
  return null;
}

const root = document.getElementById('react-root');
if (root) {
  createRoot(root).render(React.createElement(React.StrictMode, null, React.createElement(App)));
}
